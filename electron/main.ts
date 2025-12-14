import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron'
import { scanDirectory } from './fileScanner'
import { registerMangaProtocol } from './imageProtocol'
import { extractCoversForFiles, extractCoversBatch, getImageCount } from './thumbnailExtractor'
import store from './store'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

type BookCategory = 'manga' | 'novel' | 'reference' | 'other';

type BookMetadata = {
  title?: string
  author?: string
  publisher?: string
  category?: BookCategory
  tags: string[]
}

// const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
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

  // Remove default application menu for a clean window
  Menu.setApplicationMenu(null)

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  // Register custom protocol
  registerMangaProtocol()

  ipcMain.handle('dialog:openDirectory', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    if (canceled) {
      return null
    } else {
      return filePaths[0]
    }
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
        // Use shell.trashItem to move to trash instead of permanent delete for safety
        await shell.trashItem(filePath);
        return { success: true };
      } catch (error) {
        lastError = error;
        console.warn(`Delete attempt ${i + 1} failed:`, error);
        // Wait increasing amount of time before retry
        await new Promise(resolve => setTimeout(resolve, 200 * (i + 1)));
      }
    }

    console.error('Failed to delete file after retries:', lastError);
    return { success: false, error: String(lastError) };
  });

  ipcMain.handle('library:getSavedRoot', async () => {
    const savedPath = store.get('mangaRootPath')
    if (savedPath && fs.existsSync(savedPath)) {
      return savedPath
    }
    return null
  })

  ipcMain.handle('library:setRoot', async (_event, rootPath: string) => {
    store.set('mangaRootPath', rootPath)
    return rootPath
  })

  ipcMain.handle('metadata:load', async () => {
    return store.get('metadata', {}) as Record<string, BookMetadata>
  })

  ipcMain.handle('metadata:update', async (_event, filePath: string, metadata: BookMetadata) => {
    const currentMetadata = store.get('metadata', {}) as Record<string, BookMetadata>
    currentMetadata[filePath] = {
      ...metadata,
      title: metadata.title,
      tags: metadata.tags ?? [],
    }
    store.set('metadata', currentMetadata)
    return currentMetadata[filePath]
  })

  ipcMain.handle('archive:getImageCount', async (_event, archivePath: string) => {
    return await getImageCount(archivePath)
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
