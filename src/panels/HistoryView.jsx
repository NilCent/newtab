import React, { useEffect, useMemo, useState } from 'react'
import { sendMessage } from '../messaging.js'

export default function HistoryView() {
  const [items, setItems] = useState([])
  const [q, setQ] = useState('')
  const canUse = typeof chrome !== 'undefined' && chrome?.runtime?.sendMessage
  const fetchHistory = async (text = '', days = 30, maxResults = 500) => {
    try {
      const resp = await sendMessage('getHistory', { text, days, maxResults })
      const list = (resp?.items || []).map(r => ({
        title: r.title || r.url || '',
        url: r.url,
        ts: r.ts || Date.now()
      })).filter(x => !!x.url)
      const seen = new Map()
      for (const it of list) {
        const prev = seen.get(it.url)
        if (!prev || it.ts > prev.ts) seen.set(it.url, it)
      }
      return Array.from(seen.values()).sort((a,b) => b.ts - a.ts)
    } catch {
      return []
    }
  }
  useEffect(() => {
    if (!canUse) return setItems([])
    fetchHistory('', 30, 500).then(setItems)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      if (!canUse) return setItems([])
      const text = (q || '').trim()
      const days = text ? 90 : 30
      fetchHistory(text, days, 500).then(setItems)
    }, 300)
    return () => clearTimeout(t)
  }, [q])
  const fmt = (ts) => {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2,'0')
    const mm = String(d.getMinutes()).padStart(2,'0')
    return `${d.getMonth()+1}月${d.getDate()}日 ${hh}:${mm}`
  }
  const list = useMemo(() => items.slice(0, (q ? 100 : 50)), [items, q])
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ padding: 10, borderBottom: '1px solid var(--border)' }}>
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="搜索历史记录（标题/链接）"
          style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px', fontSize: 13 }}
        />
      </div>
      <div style={{ overflow: 'auto', padding: '8px 10px' }}>
        {!canUse && <div className="empty" style={{ color: 'var(--subtle)', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>没有权限</div>}
        {canUse && list.length === 0 && <div className="empty" style={{ color: 'var(--subtle)', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>没有匹配的历史记录</div>}
        {canUse && list.map((it, i) => (
          <div key={`${it.url}-${i}`} className="item" style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <a className="title" href={it.url} target="_blank" rel="noopener" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: '1 1 auto' }}>
              {it.title || it.url}
            </a>
            <div className="time" style={{ fontSize: 12, color: 'var(--subtle)', flex: '0 0 auto', marginLeft: 8, whiteSpace: 'nowrap' }}>{fmt(it.ts)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
