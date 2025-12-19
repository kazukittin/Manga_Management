import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { scanDirectory } from './fileScanner'
import { registerMangaProtocol } from './imageProtocol'
import { extractCoversForFiles, extractCoversBatch, getImageCount, clearThumbnailCache } from './thumbnailExtractor'
import store from './store'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import { load } from 'cheerio'

type BookCategory = 'manga' | 'novel' | 'reference' | 'other' | 'uncategorized';

type BookMetadata = {
  title?: string
  author?: string
  publisher?: string
  category?: BookCategory
  tags: string[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.maximize()
  win.webContents.openDevTools()
  Menu.setApplicationMenu(null)

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  registerMangaProtocol()

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
    return canceled ? null : filePaths[0]
  })

  ipcMain.handle('library:scan', async (_event, path) => {
    return await scanDirectory(path)
  })

  ipcMain.handle('library:getCovers', async (_event, filePaths: string[]) => {
    return await extractCoversForFiles(filePaths)
  })

  ipcMain.handle('library:getCoversBatch', async (_event, filePaths: string[], startIndex: number, count: number) => {
    return await extractCoversBatch(filePaths, startIndex, count)
  })

  ipcMain.handle('library:deleteManga', async (_, filePath: string) => {
    const maxRetries = 3;
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        await shell.trashItem(filePath);
        return { success: true };
      } catch (error) {
        lastError = error;
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }
    return { success: false, error: String(lastError) };
  });

  ipcMain.handle('library:getSavedRoot', async () => {
    const savedPaths = store.get('libraryPaths') as string[] | undefined
    // Migration: support old single path format
    if (!savedPaths) {
      const oldPath = store.get('mangaRootPath') as string | undefined
      if (oldPath && fs.existsSync(oldPath)) {
        return [oldPath]
      }
      return null
    }
    // Filter to only existing paths
    return savedPaths.filter(p => fs.existsSync(p))
  })

  ipcMain.handle('library:setRoot', async (_event, paths: string[]) => {
    store.set('libraryPaths', paths)
  })

  ipcMain.handle('metadata:load', async () => {
    return store.get('metadata', {}) as Record<string, BookMetadata>
  })

  ipcMain.handle('metadata:update', async (_event, filePath: string, metadata: BookMetadata) => {
    const currentMetadata = store.get('metadata', {}) as Record<string, BookMetadata>
    currentMetadata[filePath] = { ...metadata, title: metadata.title, tags: metadata.tags ?? [] }
    store.set('metadata', currentMetadata)
    return currentMetadata[filePath]
  })

  ipcMain.handle('archive:getImageCount', async (_event, archivePath: string) => {
    return await getImageCount(archivePath)
  })

  async function fetchDLsiteMetadata(query: string) {
    try {
      // 1. Determine Target URL
      let targetUrl = ''
      const rjMatch = query.match(/RJ\d{6,8}/i)

      if (rjMatch) {
        // Direct product page (try 'work' - redirects usually handle mania/books/etc)
        // Actually simpler to search by ID which guarantees redirection to correct service (maniax/books/etc)
        targetUrl = `https://www.dlsite.com/maniax/work/=/product_id/${rjMatch[0]}.html`
      } else {
        // Search by keyword
        const searchUrl = `https://www.dlsite.com/maniax/fsr/=/language/jp/keyword/${encodeURIComponent(query)}`
        const searchRes = await fetch(searchUrl)
        const searchHtml = await searchRes.text()
        const $ = load(searchHtml)

        // Find first result
        // Try multiple selectors or find first product link
        const productLink = $('a[href*="/work/=/product_id/RJ"]').filter((_, el) => {
          // Filter out wishlist/cart/review links if any, keep "work" links
          return $(el).attr('href')?.includes('/work/=/product_id/RJ') ?? false;
        }).first().attr('href')

        if (productLink) {
          targetUrl = productLink
        } else {
          return null
        }
      }

      // 2. Scrape Product Page
      const res = await fetch(targetUrl)
      // Handle 404
      if (!res.ok) return null

      const html = await res.text()
      const $ = load(html)

      // Extract Data
      const title = $('#work_name').text().trim()
      const maker = $('.maker_name').text().trim()
      const author = $('table#work_outline th:contains("作者")').next().text().trim() ||
        $('table#work_outline th:contains("Authors")').next().text().trim()

      const tags: string[] = []
      $('.main_genre a').each((_, el) => {
        tags.push($(el).text().trim())
      })

      const description = $('.work_parts_area').text().trim()

      // Scrape work format (作品形式) to auto-categorize
      const workFormat = $('table#work_outline th:contains("作品形式")').next().text().trim() ||
        $('table#work_outline th:contains("Work Format")').next().text().trim()

      // Auto-categorize based on work format
      let category: 'manga' | 'novel' | 'reference' | 'other' | undefined = undefined
      if (workFormat.includes('CG') || workFormat.includes('イラスト')) {
        category = 'manga'
      }

      // Cover Image
      let coverUrl = ''
      const sliderImg = $('.slider_item').first().attr('src') // Standard slider
      const metaImg = $('meta[property="og:image"]').attr('content') // Fallback

      if (sliderImg) {
        coverUrl = sliderImg.startsWith('//') ? 'https:' + sliderImg : sliderImg
      } else if (metaImg) {
        coverUrl = metaImg
      }

      // Download Cover if found
      let coverBase64 = undefined
      if (coverUrl) {
        try {
          const imgRes = await fetch(coverUrl, {
            headers: { 'Referer': 'https://www.dlsite.com/' }
          })
          if (imgRes.ok) {
            const buffer = await imgRes.arrayBuffer()
            coverBase64 = `data:${imgRes.headers.get('content-type') || 'image/jpeg'};base64,${Buffer.from(buffer).toString('base64')}`
          }
        } catch (e) {
          console.error('Failed to download DLsite cover', e)
        }
      }

      return {
        title,
        author: author || maker, // Fallback to circle name if author not explicit
        publisher: maker,
        tags,
        description,
        cover: coverBase64,
        category
      }

    } catch (error) {
      console.error('DLsite Scraping Error:', error)
      return null
    }
  }

  ipcMain.handle('metadata:fetch-by-title', async (_event, title: string) => {
    try {
      // Priority 1: DLsite (RJ code or specifically Doujin-like)
      // Check for RJ code
      if (/RJ\d{6,8}/i.test(title)) {
        const dlsiteData = await fetchDLsiteMetadata(title)
        if (dlsiteData) return dlsiteData
      }

      // Priority 2: Google Books (General books)
      const gbResponse = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}`)
      const gbData = await gbResponse.json()

      if (gbData.items && gbData.items.length > 0) {
        const info = gbData.items[0].volumeInfo
        return {
          title: info.title,
          author: info.authors ? info.authors[0] : undefined,
          publisher: info.publisher,
          tags: info.categories || [],
          description: info.description
        }
      }

      // Priority 3: DLsite Keyword Search (Fallback if Google Books fails)
      // If we didn't try DLsite yet, try it now as fallback
      if (!/RJ\d{6,8}/i.test(title)) {
        const dlsiteFallback = await fetchDLsiteMetadata(title)
        if (dlsiteFallback) return dlsiteFallback
      }

      return null
    } catch (error) {
      console.error('Failed to fetch metadata:', error)
      return null
    }
  })

  // Save cover image
  ipcMain.handle('metadata:save-cover', async (_event, filePath: string, base64Data: string) => {
    try {
      const ext = path.extname(filePath).toLowerCase()
      if (ext !== '.zip' && ext !== '.cbz') {
        return { success: false, error: 'Only zip/cbz archives support custom covers' }
      }

      const dir = path.dirname(filePath)
      const baseName = path.basename(filePath, ext)
      const sidecarPath = path.join(dir, `${baseName}.jpg`)

      const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Image, 'base64')

      fs.writeFileSync(sidecarPath, buffer)

      clearThumbnailCache()

      return { success: true }
    } catch (e) {
      console.error('Failed to save cover', e)
      return { success: false, error: String(e) }
    }
  })

  // Progress persistence
  ipcMain.handle('progress:save', async (_event, filePath: string, page: number) => {
    const progress = store.get('progress', {})
    progress[filePath] = page
    store.set('progress', progress)
  })

  ipcMain.handle('progress:load', async (_event, filePath: string) => {
    const progress = store.get('progress', {})
    return progress[filePath] ?? 0
  })

  // Preferences persistence
  ipcMain.handle('preferences:save', async (_event, prefs: { viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }) => {
    store.set('preferences', prefs)
  })

  ipcMain.handle('preferences:load', async () => {
    return store.get('preferences')
  })

  createWindow()
})
