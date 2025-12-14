import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanLibrary: (path: string) => ipcRenderer.invoke('library:scan', path),
  getCovers: (filePaths: string[]) => ipcRenderer.invoke('library:getCovers', filePaths),
  getCoversBatch: (filePaths: string[], startIndex: number, count: number) => ipcRenderer.invoke('library:getCoversBatch', filePaths, startIndex, count),
  getSavedRoot: () => ipcRenderer.invoke('library:getSavedRoot'),
  setRoot: (path: string) => ipcRenderer.invoke('library:setRoot', path),
  getImageCount: (archivePath: string) => ipcRenderer.invoke('archive:getImageCount', archivePath),
  saveProgress: (filePath: string, page: number) => ipcRenderer.invoke('progress:save', filePath, page),
  loadProgress: (filePath: string) => ipcRenderer.invoke('progress:load', filePath),
  savePreferences: (prefs: { viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }) => ipcRenderer.invoke('preferences:save', prefs),
  loadPreferences: () => ipcRenderer.invoke('preferences:load'),
  loadMetadata: () => ipcRenderer.invoke('metadata:load'),
  saveMetadata: (filePath: string, metadata: { title?: string; author?: string; publisher?: string; category?: 'manga' | 'novel' | 'reference' | 'other'; tags: string[] }) =>
    ipcRenderer.invoke('metadata:update', filePath, metadata),
  deleteManga: (filePath: string) => ipcRenderer.invoke('library:deleteManga', filePath),
})
