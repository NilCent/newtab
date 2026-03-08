import React, { useMemo, useState } from 'react'

const engines = [
  { value: 'google', label: 'Google' },
  { value: 'bing', label: 'Bing' },
  { value: 'baidu', label: '百度' }
]

export default function SearchBar({ disabled }) {
  const [engine, setEngine] = useState('google')
  const [q, setQ] = useState('')
  const urls = useMemo(() => ({
    google: v => `https://www.google.com/search?q=${encodeURIComponent(v)}`,
    bing: v => `https://www.bing.com/search?q=${encodeURIComponent(v)}`,
    baidu: v => `https://www.baidu.com/s?wd=${encodeURIComponent(v)}`
  }), [])
  const submit = e => {
    e.preventDefault()
    if (disabled) return
    const v = (q || '').trim()
    if (!v) return
    const to = (urls[engine] || urls.google)(v)
    window.open(to, '_blank', 'noopener')
  }
  return (
    <section className={`search-section ${disabled ? 'penalty-disabled' : ''}`}>
      <label className="sr-only" htmlFor="engine">选择搜索引擎</label>
      <select id="engine" className="engine-select" aria-label="选择搜索引擎" value={engine} onChange={e => setEngine(e.target.value)} disabled={disabled}>
        {engines.map(it => <option key={it.value} value={it.value}>{it.label}</option>)}
      </select>
      <form className="search-form" role="search" aria-label="站点搜索" onSubmit={submit}>
        <input className="search-input" type="text" placeholder={disabled ? '有任务逾期，请先完成任务' : '输入关键字开始搜索...'} value={q} onChange={e => setQ(e.target.value)} disabled={disabled} />
        <button type="submit" className="search-btn" disabled={disabled}>搜索</button>
      </form>
    </section>
  )
}
