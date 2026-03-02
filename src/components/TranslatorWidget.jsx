import React, { useState } from 'react'
import { sendMessage } from '../messaging.js'

const langs = ['en','zh','ja','ko','fr','de','es','ru']

export default function TranslatorWidget() {
  const [text, setText] = useState('')
  const [src, setSrc] = useState('en')
  const [dst, setDst] = useState('zh')
  const [out, setOut] = useState('')
  const run = async () => {
    const q = (text || '').trim()
    if (!q) return
    setOut('翻译中…')
    try {
      const resp = await sendMessage('translate', { text: q, src, dst })
      const t = resp?.text || ''
      if (t) {
        setOut(t)
      } else {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=${src}|${dst}`
        const res = await fetch(url)
        const data = await res.json()
        const tt = data?.responseData?.translatedText || ''
        setOut(tt || '未获取到结果')
      }
    } catch {
      setOut('请求失败')
    }
  }
  return (
    <div className="widget-inner translator" style={{ display: 'grid', gridTemplateColumns: '1fr', gridTemplateRows: '2fr auto 2fr', gap: 6, padding: 6, height: '100%', width: '100%', justifyItems: 'stretch', alignItems: 'stretch' }}>
      <div className="translator-input" style={{ height: '100%', width: '100%', margin: 0, gridColumn: '1 / -1', justifySelf: 'stretch' }}>
        <textarea className="tr-input" placeholder="输入待翻译文本..." value={text} onChange={e => setText(e.target.value)} style={{ width: '100%', height: '100%', resize: 'none', boxSizing: 'border-box' }} />
      </div>
      <div className="translator-controls" style={{ width: '100%', gridColumn: '1 / -1', justifySelf: 'stretch' }}>
        <select className="tr-select" value={src} onChange={e => setSrc(e.target.value)}>
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <span className="tr-arrow">→</span>
        <select className="tr-select" value={dst} onChange={e => setDst(e.target.value)}>
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <button className="tr-btn" onClick={run}>翻译</button>
      </div>
      <div className="translator-output" aria-live="polite" style={{ width: '100%', height: '100%', overflow: 'auto', boxSizing: 'border-box', margin: 0, gridColumn: '1 / -1', justifySelf: 'stretch' }}>{out}</div>
    </div>
  )
}
