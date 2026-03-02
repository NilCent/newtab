import React, { useEffect, useMemo, useState } from 'react'
import data from '../../quotes.json'

const DS_KEY = 'quotesDataset'

export default function QuoteWidget({ onOpenSettings }) {
  const [list, setList] = useState([])
  const [idx, setIdx] = useState(0)
  const next = () => {
    const n = list.length
    if (n <= 1) { setIdx(0); return }
    let r = Math.floor(Math.random() * n)
    if (r === idx) r = (r + 1) % n
    setIdx(r)
  }
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DS_KEY)
      const ds = raw ? JSON.parse(raw) : null
      if (ds && Array.isArray(ds) && ds.length) {
        setList(ds)
      } else {
        if (Array.isArray(data) && data.length) {
          setList(data)
          localStorage.setItem(DS_KEY, JSON.stringify(data))
        } else {
          setList([])
        }
      }
    } catch {
      setList(Array.isArray(data) ? data : [])
    }
  }, [])
  useEffect(() => {
    const n = list.length
    if (n) {
      setIdx(Math.floor(Math.random() * n))
    } else {
      setIdx(0)
    }
  }, [list])
  const cur = useMemo(() => {
    const it = list[idx]
    const t = (it?.t || '').trim()
    const a = (it?.a || '').trim()
    if (!t) return { t: '千里之行，始于足下', a: '老子' }
    return { t, a }
  }, [list, idx])
  return (
    <div className="widget-inner" onContextMenu={e => { e.preventDefault(); onOpenSettings && onOpenSettings() }}>
      <div className="quote-content">
        <div className="quote-text">{cur.t}</div>
        <div className="quote-author">{cur.a || ''}</div>
      </div>
      <button className="quote-next" aria-label="下一句" onClick={next}>›</button>
    </div>
  )
}
