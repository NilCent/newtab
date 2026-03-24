const oneDay = 86400000
const CACHE_NAME = 'newtab-bg-cache-v1'
const BG_CACHE_KEY = 'background-image'

async function cacheBackgroundImage(url) {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch(url)
    if (response.ok) {
      await cache.put(BG_CACHE_KEY, response)
      return { ok: true }
    }
    return { ok: false, error: 'Fetch failed' }
  } catch (error) {
    console.error('[background] Cache error:', error)
    return { ok: false, error: error.message }
  }
}

async function getCachedBackgroundImage() {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(BG_CACHE_KEY)
    if (response) {
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      return { ok: true, data: base64, contentType: response.headers.get('Content-Type') }
    }
    return { ok: false, error: 'Not cached' }
  } catch (error) {
    console.error('[background] Get cached error:', error)
    return { ok: false, error: error.message }
  }
}

async function cacheBackgroundImageByKey(payload) {
  try {
    const { url, key } = payload
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch(url)
    if (response.ok) {
      await cache.put(key, response)
      return { ok: true }
    }
    return { ok: false, error: 'Fetch failed' }
  } catch (error) {
    console.error('[background] Cache by key error:', error)
    return { ok: false, error: error.message }
  }
}

async function getCachedBackgroundImageByKey(payload) {
  try {
    const { key } = payload
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(key)
    if (response) {
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      return { ok: true, data: base64, contentType: response.headers.get('Content-Type') }
    }
    return { ok: false, error: 'Not cached' }
  } catch (error) {
    console.error('[background] Get cached by key error:', error)
    return { ok: false, error: error.message }
  }
}

async function cacheBackgroundImageWithUrl(payload) {
  try {
    const { dataUrl } = payload
    const cache = await caches.open(CACHE_NAME)
    const response = await fetch(dataUrl)
    if (response.ok) {
      await cache.put(BG_CACHE_KEY, response)
      return { ok: true }
    }
    return { ok: false, error: 'Failed to cache data URL' }
  } catch (error) {
    console.error('[background] Cache with data URL error:', error)
    return { ok: false, error: error.message }
  }
}

async function getCachedBackgroundImageByUrl(payload) {
  try {
    const { url } = payload
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(url)
    if (response) {
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      return { ok: true, data: base64, contentType: response.headers.get('Content-Type') }
    }
    const cacheResult = await cacheBackgroundImage(url)
    if (cacheResult.ok) {
      const newResponse = await cache.match(BG_CACHE_KEY)
      if (newResponse) {
        const blob = await newResponse.blob()
        const base64 = await blobToBase64(blob)
        return { ok: true, data: base64, contentType: newResponse.headers.get('Content-Type') }
      }
    }
    return { ok: false, error: 'Not cached' }
  } catch (error) {
    console.error('[background] Get cached by URL error:', error)
    return { ok: false, error: error.message }
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function doTranslate(payload) {
  const q = (payload?.text || '').trim()
  const src = payload?.src || 'en'
  const dst = payload?.dst || 'zh'
  if (!q) return { text: '' }
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${src}|${dst}`
  const res = await fetch(url)
  const data = await res.json()
  const t = data?.responseData?.translatedText || ''
  return { text: t }
}

function doGetHistory(payload = {}) {
  return new Promise(resolve => {
    const text = payload.text || ''
    const days = payload.days || 30
    const maxResults = payload.maxResults || 200
    const startTime = Date.now() - days * oneDay
    
    chrome.history.search({ text, startTime, maxResults }, list => {
      const out = list.map(it => ({
        url: it.url,
        title: it.title,
        ts: it.lastVisitTime
      }))
      resolve({ items: out })
    })
  })
}

function storageGet(payload = {}) {
  const key = payload.key
  return new Promise(resolve => {
    try {
      chrome.storage.local.get([key], v => resolve({ value: v?.[key] }))
    } catch {
      resolve({ value: undefined })
    }
  })
}

function storageSet(payload = {}) {
  const key = payload.key
  const value = payload.value
  return new Promise(resolve => {
    try {
      chrome.storage.local.set({ [key]: value }, () => resolve({ ok: true }))
    } catch {
      resolve({ ok: false })
    }
  })
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const type = message?.type
  const payload = message?.payload

  ;(async () => {
    try {
      let result
      if (type === 'translate') {
        result = await doTranslate(payload)
      } else if (type === 'getHistory') {
        result = await doGetHistory(payload)
      } else if (type === 'storageGet') {
        result = await storageGet(payload)
      } else if (type === 'storageSet') {
        result = await storageSet(payload)
      } else if (type === 'cacheBackgroundImage') {
        result = await cacheBackgroundImage(payload.url)
      } else if (type === 'getCachedBackgroundImage') {
        result = await getCachedBackgroundImage()
      } else if (type === 'cacheBackgroundImageByKey') {
        result = await cacheBackgroundImageByKey(payload)
      } else if (type === 'getCachedBackgroundImageByKey') {
        result = await getCachedBackgroundImageByKey(payload)
      } else if (type === 'cacheBackgroundImageWithUrl') {
        result = await cacheBackgroundImageWithUrl(payload)
      } else if (type === 'getCachedBackgroundImageByUrl') {
        result = await getCachedBackgroundImageByUrl(payload)
      } else {
        result = null
      }
      sendResponse(result)
    } catch (error) {
      console.error('[background] Error:', error)
      sendResponse(null)
    }
  })()

  return true
})
