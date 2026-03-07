import React, { useEffect } from 'react'

export default function AddModal({ open, onClose, onSelect }) {
  useEffect(() => {
    const onKey = e => { if (open && e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  useEffect(() => {
    const prev = document.body.style.overflow
    if (open) document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])
  if (!open) return null
  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.12)', zIndex: 3000
  }
  const cardStyle = {
    position: 'fixed', top: '8vh', left: '50%', transform: 'translateX(-50%)',
    width: 'min(96vw, 1000px)', maxHeight: '88vh', background: '#fff',
    borderRadius: 16, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'auto', zIndex: 3001
  }
  const headerStyle = { padding: 16, fontWeight: 800, color: '#6b7280', borderBottom: '1px solid rgba(0,0,0,.08)' }
  const listStyle = { padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(280px, 1fr))', gap: 24 }
  const itemWrap = {
    width: '100%', height: 320, border: '3px dashed rgba(31,41,55,.25)', borderRadius: 16,
    background: 'transparent', display: 'grid', gridTemplateRows: '1fr auto', alignItems: 'stretch', cursor: 'pointer'
  }
  const previewBox = { padding: 16, display: 'grid', alignItems: 'center', justifyItems: 'center' }
  const labelBox = { padding: 12, borderTop: '1px dashed rgba(31,41,55,.12)', textAlign: 'center' }
  const title = { fontWeight: 700, fontSize: 14 }
  const desc = { fontSize: 12, color: '#6b7280', marginTop: 6 }
  const Dot = ({ size = 14 }) => <div style={{ width: size, height: size, borderRadius: 4, background: '#e5e7eb' }} />
  const Line = ({ w = '80%' }) => <div style={{ width: w, height: 10, borderRadius: 6, background: '#e5e7eb' }} />
  const Small = ({ w = '30%' }) => <div style={{ width: w, height: 8, borderRadius: 6, background: '#f1f5f9' }} />
  const HistoryPreview = ({ w = 1, h = 1 }) => (
    <div style={{ width: 220, height: h === 1 ? 180 : 220, display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Dot />
        <Line />
        <Small />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Dot />
        <Line w="70%" />
        <Small />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Dot />
        <Line w="60%" />
        <Small />
      </div>
    </div>
  )
  const QuotePreview = ({ w = 3, h = 2 }) => (
    <div style={{ width: 260, height: h === 2 ? 220 : 180, display: 'grid', gap: 8, alignItems: 'center', justifyItems: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>千里之行，始于足下</div>
      <div style={{ fontSize: 12, color: '#6b7280' }}>老子</div>
      <div style={{ width: 28, height: 28, borderRadius: 14, border: '1px solid #e5e7eb' }} />
    </div>
  )
  const TranslatorPreview = ({ w = 3, h = 2 }) => (
    <div style={{ width: 260, height: 220, display: 'grid', gridTemplateRows: '1fr auto 1fr', gap: 10 }}>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto auto', gap: 8, alignItems: 'center' }}>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, height: 28 }} />
        <div style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center' }}>→</div>
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, height: 28 }} />
        <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, height: 28, width: 60 }} />
        <div style={{ background: '#3b82f6', color: '#fff', borderRadius: 10, height: 28, width: 80 }} />
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12 }} />
    </div>
  )
  const WeatherPreview = ({ w = 2, h = 2 }) => (
    <div style={{ width: 260, height: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>天气预报</div>
        <div style={{ fontSize: 14 }}>↻</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>今天</span>
          <span style={{ fontSize: 14 }}>☀️</span>
          <span style={{ fontSize: 11 }}>25° / 15°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>明天</span>
          <span style={{ fontSize: 14 }}>⛅</span>
          <span style={{ fontSize: 11 }}>23° / 14°</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>后天</span>
          <span style={{ fontSize: 14 }}>🌧️</span>
          <span style={{ fontSize: 11 }}>20° / 12°</span>
        </div>
      </div>
    </div>
  )
  return (
    <>
      <div style={overlayStyle} onClick={onClose} />
      <div style={cardStyle} role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>选择要添加的组件</div>
        <div style={listStyle}>
          <div style={itemWrap} onClick={() => onSelect?.('history', 1, 1)}>
            <div style={previewBox}><HistoryPreview w={1} h={1} /></div>
            <div style={labelBox}><div style={title}>历史记录 • 1×1</div><div style={desc}>最近访问的链接列表，点击可打开</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('translator', 3, 2)}>
            <div style={previewBox}><TranslatorPreview w={3} h={2} /></div>
            <div style={labelBox}><div style={title}>翻译 • 3×2</div><div style={desc}>输入文本并选择语言，点击翻译</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('translator', 2, 2)}>
            <div style={previewBox}><TranslatorPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>翻译 • 2×2</div><div style={desc}>紧凑版翻译面板</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('quote', 3, 2)}>
            <div style={previewBox}><QuotePreview w={3} h={2} /></div>
            <div style={labelBox}><div style={title}>摘抄 • 3×2</div><div style={desc}>随机展示摘抄，右下角切换下一条</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('quote', 2, 2)}>
            <div style={previewBox}><QuotePreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>摘抄 • 2×2</div><div style={desc}>紧凑显式摘抄内容与作者</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('weather', 2, 2)}>
            <div style={previewBox}><WeatherPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>天气 • 2×2</div><div style={desc}>显示最近7天天气预报</div></div>
          </div>
        </div>
      </div>
    </>
  )
}
