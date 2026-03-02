export function sendMessage(type, payload) {
  return new Promise((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome?.runtime?.sendMessage) {
      resolve(null)
      return
    }
    
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        reject(lastError)
      } else {
        resolve(response)
      }
    })
  })
}
