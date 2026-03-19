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
  const DateTimePreview = ({ w = 1, h = 1 }) => (
    <div style={{ width: 180, height: 180, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
      <div style={{ fontSize: 32, fontWeight: 600 }}>14:30</div>
      <div style={{ fontSize: 14, color: '#6b7280' }}>2024/01/15</div>
      <div style={{ fontSize: 12, color: '#9ca3af' }}>周一</div>
    </div>
  )
  const HackerNewsPreview = ({ w = 2, h = 2 }) => (
    <div style={{ width: 260, height: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>Hacker News</div>
        <div style={{ fontSize: 14 }}>↻</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#6b7280', width: 16 }}>1.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Show HN: I built a new framework</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>256 points · 89 comments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#6b7280', width: 16 }}>2.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>The future of AI in 2024</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>198 points · 67 comments</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 10, color: '#6b7280', width: 16 }}>3.</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Why Rust is gaining popularity</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>145 points · 52 comments</div>
          </div>
        </div>
      </div>
    </div>
  )
  const TodoPreview = ({ w = 2, h = 2 }) => (
    <div style={{ width: 260, height: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>待办事项</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2 }}>今天</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '1.5px solid #e5e7eb', borderRadius: 4 }}></div>
          <span style={{ fontSize: 11 }}>完成项目报告</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '1.5px solid #e5e7eb', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>2/5</div>
          <span style={{ fontSize: 11 }}>写 5 道算法题</span>
        </div>
        <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 2, marginTop: 4 }}>本周</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 14, height: 14, border: '1.5px solid #e5e7eb', borderRadius: 4 }}></div>
          <span style={{ fontSize: 11 }}>整理文档</span>
        </div>
      </div>
    </div>
  )
  const FlashcardPreview = ({ w = 1, h = 1 }) => (
    <div style={{ width: w === 1 ? 180 : 260, height: h === 1 ? 180 : 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          <span style={{ fontSize: 9, padding: '2px 4px', background: '#e0efff', color: '#3b82f6', borderRadius: 3 }}>英语</span>
        </div>
        <div style={{ fontSize: 10, color: '#6b7280' }}>1/10</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 500 }}>immune</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 24, height: 24, border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>‹</div>
        <div style={{ fontSize: 10, color: '#9ca3af' }}>点击翻转</div>
        <div style={{ width: 24, height: 24, border: '1px solid #e5e7eb', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>›</div>
      </div>
    </div>
  )
  const NotePreview = ({ w = 2, h = 2 }) => (
    <div style={{ width: 260, height: 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 14, fontWeight: 600 }}>便签</div>
      <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: 8, padding: 8, background: '#fafafa' }}>
        <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>
          今天要完成的事情：<br/>
          1. 完成项目报告<br/>
          2. 复习英语单词<br/>
          3. ...
        </div>
      </div>
    </div>
  )
  const ReadingListPreview = ({ w = 2, h = 1 }) => (
    <div style={{ width: 260, height: h === 1 ? 180 : 220, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>阅读清单</div>
        <div style={{ fontSize: 14 }}>↻</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {h === 1 ? (
          <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
            深入理解 JavaScript 异步编程
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
              深入理解 JavaScript 异步编程
            </div>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
              Rust 语言入门教程
            </div>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
              系统设计面试指南
            </div>
            <div style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '6px 8px', background: '#f8fafc', borderRadius: 6 }}>
              CSS Grid 完全指南
            </div>
          </>
        )}
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
          <div style={itemWrap} onClick={() => onSelect?.('weather', 2, 2)}>
            <div style={previewBox}><WeatherPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>天气 • 2×2</div><div style={desc}>显示最近7天天气预报</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('datetime', 1, 1)}>
            <div style={previewBox}><DateTimePreview w={1} h={1} /></div>
            <div style={labelBox}><div style={title}>日期时间 • 1×1</div><div style={desc}>显示当前时间、日期和星期</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('hackernews', 2, 2)}>
            <div style={previewBox}><HackerNewsPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>Hacker News • 2×2</div><div style={desc}>显示当天热门技术文章</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('hackernews', 3, 2)}>
            <div style={previewBox}><HackerNewsPreview w={3} h={2} /></div>
            <div style={labelBox}><div style={title}>Hacker News • 3×2</div><div style={desc}>更宽的显示区域</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('todo', 2, 2)}>
            <div style={previewBox}><TodoPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>待办事项 • 2×2</div><div style={desc}>管理待完成的任务</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('flashcard', 1, 1)}>
            <div style={previewBox}><FlashcardPreview w={1} h={1} /></div>
            <div style={labelBox}><div style={title}>闪卡 • 1×1</div><div style={desc}>学习卡片，点击翻转查看答案</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('flashcard', 2, 2)}>
            <div style={previewBox}><FlashcardPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>闪卡 • 2×2</div><div style={desc}>更大的显示区域</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('flashcard', 3, 2)}>
            <div style={previewBox}><FlashcardPreview w={3} h={2} /></div>
            <div style={labelBox}><div style={title}>闪卡 • 3×2</div><div style={desc}>最宽的显示区域</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('note', 2, 2)}>
            <div style={previewBox}><NotePreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>便签 • 2×2</div><div style={desc}>快速记录文本，自动同步</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('note', 3, 2)}>
            <div style={previewBox}><NotePreview w={3} h={2} /></div>
            <div style={labelBox}><div style={title}>便签 • 3×2</div><div style={desc}>更大的记录空间</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('readinglist', 2, 1)}>
            <div style={previewBox}><ReadingListPreview w={2} h={1} /></div>
            <div style={labelBox}><div style={title}>阅读清单 • 2×1</div><div style={desc}>随机展示 Chrome 阅读清单</div></div>
          </div>
          <div style={itemWrap} onClick={() => onSelect?.('readinglist', 2, 2)}>
            <div style={previewBox}><ReadingListPreview w={2} h={2} /></div>
            <div style={labelBox}><div style={title}>阅读清单 • 2×2</div><div style={desc}>展示更多阅读内容</div></div>
          </div>
        </div>
      </div>
    </>
  )
}
