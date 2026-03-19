import React, { useState, useEffect, useCallback } from 'react'

const hasReadingListAPI = () => {
  try {
    return typeof chrome !== 'undefined' && 
           chrome.readingList && 
           typeof chrome.readingList.query === 'function'
  } catch {
    return false
  }
}

export default function ReadingListWidget({ size }) {
  const [items, setItems] = useState([])
  const [displayItems, setDisplayItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadReadingList = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    if (!hasReadingListAPI()) {
      setItems([])
      setLoading(false)
      return
    }
    
    try {
      const result = await chrome.readingList.query({})
      setItems(result || [])
    } catch (e) {
      console.error('Failed to load reading list:', e)
      setError(e.message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReadingList()
  }, [loadReadingList])

  const shuffleItems = useCallback(() => {
    if (items.length > 0) {
      const shuffled = [...items].sort(() => Math.random() - 0.5)
      setDisplayItems(shuffled)
    }
  }, [items])

  useEffect(() => {
    shuffleItems()
  }, [shuffleItems])

  const handleRefresh = () => {
    shuffleItems()
  }

  const handleClick = (url) => {
    window.open(url, '_blank')
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (days === 0) return '今天'
    return `${days}天前`
  }

  const getDomain = (url) => {
    try {
      const u = new URL(url)
      return u.hostname.replace('www.', '')
    } catch {
      return ''
    }
  }

  const hasAPI = hasReadingListAPI()

  return (
    <div className="widget-inner reading-list-widget">
      <div className="rl-header">
        <span className="rl-title">阅读清单</span>
        <button className="rl-refresh-btn" onClick={handleRefresh} disabled={loading || items.length === 0}>
          ↻
        </button>
      </div>
      <div className="rl-list">
        {loading ? (
          <div className="rl-loading">加载中...</div>
        ) : !hasAPI ? (
          <div className="rl-empty">请在 Chrome 扩展中使用</div>
        ) : error ? (
          <div className="rl-empty">加载失败: {error}</div>
        ) : displayItems.length === 0 ? (
          <div className="rl-empty">暂无阅读清单</div>
        ) : (
          displayItems.map((item, index) => (
            <div key={item.id || index} className="rl-item">
              <div className="rl-rank">{index + 1}</div>
              <div className="rl-content">
                <a 
                  href={item.url} 
                  className="rl-item-title" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.preventDefault()
                    handleClick(item.url)
                  }}
                >
                  {item.title}
                </a>
                <div className="rl-meta">
                  <span className="rl-domain">{getDomain(item.url)}</span>
                  <span className="rl-date">{formatDate(item.creationTime || item.lastUpdateTime)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
