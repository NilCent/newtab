import React, { useEffect, useMemo, useState } from 'react'
import { sendMessage } from '../messaging.js'

const QKEY = 'quotesDataset'

export default function QuoteSettingsView() {
  const [all, setAll] = useState([])
  const [query, setQuery] = useState('')
  const [newText, setNewText] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const load = async () => {
    try {
      const resp = await sendMessage('storageGet', { key: QKEY })
      const ds = resp?.value
      if (Array.isArray(ds)) setAll(ds)
      else setAll([])
    } catch {
      try {
        const res = await fetch('/quotes.json', { cache: 'no-cache' })
        const data = await res.json()
        setAll(Array.isArray(data) ? data : [])
      } catch {
        setAll([])
      }
    }
  }
  useEffect(() => { load() }, [])
  const filtered = useMemo(() => {
    const q = (query || '').toLowerCase()
    return all.filter(it => (it.t || '').toLowerCase().includes(q) || (it.a || '').toLowerCase().includes(q))
  }, [all, query])
  const addOne = async () => {
    const t = (newText || '').trim()
    const a = (newAuthor || '').trim()
    if (!t) return
    const ds = [{ t, a }, ...all]
    try { await sendMessage('storageSet', { key: QKEY, value: ds }) } catch {}
    setAll(ds)
    setNewText('')
    setNewAuthor('')
  }
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', fontWeight: 700 }}>摘抄配置</div>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', display: 'grid', gap: 8 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="搜索摘抄（内容/作者）" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px', fontSize: 13 }} />
        <div style={{ display: 'grid', gap: 6 }}>
          <input value={newText} onChange={e => setNewText(e.target.value)} placeholder="新增内容…" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px', fontSize: 13 }} />
          <input value={newAuthor} onChange={e => setNewAuthor(e.target.value)} placeholder="作者（可选）" style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '8px 10px', fontSize: 13 }} />
          <button onClick={addOne} className="btn" style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 10, padding: '8px 12px', fontWeight: 600, cursor: 'pointer' }}>保存并添加</button>
        </div>
      </div>
      <div style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 8 }}>
        {filtered.length === 0 && <div style={{ color: 'var(--subtle)', textAlign: 'center', padding: '16px 0', fontSize: 13 }}>暂无数据</div>}
        {filtered.map((it, idx) => (
          <div key={idx} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{it.t}</div>
            <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{it.a || ''}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
