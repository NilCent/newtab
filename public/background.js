const oneDay = 86400000

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
