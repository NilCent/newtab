import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { sendMessage } from '../messaging'

const STORAGE_KEY = 'historySettings'

function getFaviconUrl(pageUrl, size = 32) {
  const url = new URL(chrome.runtime.getURL("/_favicon/"))
  url.searchParams.set("pageUrl", pageUrl)
  url.searchParams.set("size", size.toString())
  return url.toString()
}

export default function HistoryView({ onOpenSettings }) {
  const [items, setItems] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [blacklistEnabled, setBlacklistEnabled] = useState(false)
  const [blacklistRules, setBlacklistRules] = useState([])
  const searchInputRef = useRef(null)

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const resp = await sendMessage('storageGet', { key: STORAGE_KEY })
        const settings = resp?.value || { enabled: false, rules: '' }
        setBlacklistEnabled(settings.enabled || false)
        const rules = (settings.rules || '')
          .split('\n')
          .map(r => r.trim())
          .filter(r => r.length > 0)
        setBlacklistRules(rules)
      } catch {
        setBlacklistEnabled(false)
        setBlacklistRules([])
      }
    }
    loadSettings()

    const handleStorageChange = (changes, areaName) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const settings = changes[STORAGE_KEY].newValue || { enabled: false, rules: '' }
        setBlacklistEnabled(settings.enabled || false)
        const rules = (settings.rules || '')
          .split('\n')
          .map(r => r.trim())
          .filter(r => r.length > 0)
        setBlacklistRules(rules)
      }
    }
    chrome.storage.onChanged.addListener(handleStorageChange)
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange)
    }
  }, [])

  const isBlacklisted = useCallback((item) => {
    if (!blacklistEnabled || blacklistRules.length === 0) return false
    const text = `${item.url} ${item.title}`.toLowerCase()
    return blacklistRules.some(rule => text.includes(rule.toLowerCase()))
  }, [blacklistEnabled, blacklistRules])

  const fetchHistory = useCallback(async (text = '', days = 30, maxResults = 500) => {
    try {
      const resp = await sendMessage('getHistory', { text, days, maxResults })
      const list = (resp?.items || [])
        .map(it => ({
          url: it.url,
          title: it.title || it.url || '',
          ts: it.ts || Date.now()
        }))
        .filter(x => !!x.url)

      const map = new Map()
      for (const it of list) {
        const prev = map.get(it.url)
        if (!prev || it.ts > prev.ts) map.set(it.url, it)
      }
      return Array.from(map.values()).sort((a, b) => b.ts - a.ts)
    } catch (error) {
      console.error('[HistoryView] fetchHistory error:', error)
      return []
    }
  }, [])

  const loadHistory = useCallback(async (searchText = '') => {
    setLoading(true)
    try {
      const s = (searchText || '').trim()
      const days = s ? 90 : 30
      const data = await fetchHistory(s, days, 500)
      setItems(data)
    } finally {
      setLoading(false)
    }
  }, [fetchHistory])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleSearch = useCallback((text) => {
    setQuery(text)
    loadHistory(text)
  }, [loadHistory])

  const formatTime = useCallback((ts) => {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${d.getMonth() + 1}月${d.getDate()}日 ${hh}:${mm}`
  }, [])

  const displayItems = useMemo(() => {
    const filtered = items.filter(item => !isBlacklisted(item))
    const hasSearch = (query || '').trim().length > 0
    return hasSearch ? filtered.slice(0, 100) : filtered.slice(0, 50)
  }, [items, isBlacklisted, query])

  return (
    <div className="history-view">
      <div className="history-header">
        <div className="history-title">最近历史</div>
        <div className="history-actions">
          {onOpenSettings && (
            <button className="config-btn" onClick={onOpenSettings}>
              配置
            </button>
          )}
        </div>
      </div>
      <div className="history-search">
        <input
          ref={searchInputRef}
          className="history-search-input"
          type="text"
          placeholder="搜索历史记录（标题/链接）"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          autoComplete="off"
        />
      </div>
      <div className="history-list">
        {loading ? (
          <div className="history-empty">加载中...</div>
        ) : displayItems.length === 0 ? (
          <div className="history-empty">没有匹配的历史记录</div>
        ) : (
          displayItems.map((item, index) => (
            <div key={`${item.url}-${index}`} className="history-item">
              <img
                className="history-item-favicon"
                src={getFaviconUrl(item.url)}
                alt=""
                onError={(e) => { e.target.style.display = 'none' }}
              />
              <a
                className="history-item-title"
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </a>
              <div className="history-item-time">{formatTime(item.ts)}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
