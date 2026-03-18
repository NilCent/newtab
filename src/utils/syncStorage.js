const isExtension = typeof chrome !== 'undefined' && chrome.storage

export async function getSyncData(key) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.get([key], (result) => {
        resolve(result[key] || null)
      })
    })
  }
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

export async function setSyncData(key, value) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [key]: value }, resolve)
    })
  }
  localStorage.setItem(key, JSON.stringify(value))
}

export async function removeSyncData(key) {
  if (isExtension) {
    return new Promise((resolve) => {
      chrome.storage.sync.remove([key], resolve)
    })
  }
  localStorage.removeItem(key)
}

export function onSyncChange(key, callback) {
  if (isExtension) {
    const listener = (changes, areaName) => {
      if (areaName === 'sync' && changes[key]) {
        callback(changes[key].newValue)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }
  return () => {}
}
