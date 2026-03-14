const DB_NAME = 'flashcard-db'
const DB_VERSION = 2
const STORE_NAME = 'configs'

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.close()
        const upgradeRequest = indexedDB.open(DB_NAME, DB_VERSION + 1)
        upgradeRequest.onerror = () => reject(upgradeRequest.error)
        upgradeRequest.onsuccess = () => resolve(upgradeRequest.result)
        upgradeRequest.onupgradeneeded = (event) => {
          const upgradeDb = event.target.result
          if (!upgradeDb.objectStoreNames.contains(STORE_NAME)) {
            upgradeDb.createObjectStore(STORE_NAME)
          }
        }
      } else {
        resolve(db)
      }
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

export async function saveWidgetConfig(widgetId, config) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.put(config, widgetId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function loadWidgetConfig(widgetId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(widgetId)
    
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function clearWidgetConfig(widgetId) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const request = store.delete(widgetId)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
  })
}

export async function checkPermission(handle) {
  if (!handle) return { granted: false, canRequest: false }
  
  try {
    const permission = await handle.queryPermission({ mode: 'read' })
    if (permission === 'granted') {
      return { granted: true, canRequest: false }
    }
    
    const requestPermission = await handle.requestPermission({ mode: 'read' })
    return { granted: requestPermission === 'granted', canRequest: true }
  } catch (e) {
    return { granted: false, canRequest: false }
  }
}

export async function selectDirectory() {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
      id: 'flashcard-dir'
    })
    return { success: true, handle, name: handle.name, type: 'directory' }
  } catch (e) {
    if (e.name === 'AbortError') {
      return { success: false, error: 'cancelled' }
    }
    return { success: false, error: e.message }
  }
}

export async function selectFile() {
  try {
    const [handle] = await window.showOpenFilePicker({
      mode: 'read',
      id: 'flashcard-file',
      types: [{
        description: 'Markdown Files',
        accept: { 'text/markdown': ['.md'] }
      }]
    })
    const file = await handle.getFile()
    return { success: true, handle, name: file.name, type: 'file' }
  } catch (e) {
    if (e.name === 'AbortError') {
      return { success: false, error: 'cancelled' }
    }
    return { success: false, error: e.message }
  }
}

async function readMarkdownFilesFromDirectory(dirHandle, basePath = '') {
  const files = []
  
  for await (const entry of dirHandle.values()) {
    const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name
    
    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      try {
        const file = await entry.getFile()
        const content = await file.text()
        files.push({
          name: entry.name,
          path: currentPath,
          content
        })
      } catch (e) {
        console.error(`Failed to read ${currentPath}:`, e)
      }
    } else if (entry.kind === 'directory') {
      const subFiles = await readMarkdownFilesFromDirectory(entry, currentPath)
      files.push(...subFiles)
    }
  }
  
  return files
}

export async function loadFlashcardFiles(handle) {
  if (!handle) return []
  
  const { granted } = await checkPermission(handle)
  if (!granted) return []
  
  try {
    if (handle.kind === 'directory') {
      const files = await readMarkdownFilesFromDirectory(handle)
      return files
    } else if (handle.kind === 'file') {
      const file = await handle.getFile()
      const content = await file.text()
      return [{
        name: file.name,
        path: file.name,
        content
      }]
    }
    return []
  } catch (e) {
    console.error('Failed to load flashcard files:', e)
    return []
  }
}
