import React, { useEffect, useMemo, useState } from 'react'
import GridLayout, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import SearchBar from './components/SearchBar.jsx'
import TranslatorWidget from './components/TranslatorWidget.jsx'
import WeatherWidget from './components/WeatherWidget.jsx'
import DateTimeWidget from './components/DateTimeWidget.jsx'
import HackerNewsWidget from './components/HackerNewsWidget.jsx'
import TodoWidget from './components/TodoWidget.jsx'
import FlashcardWidget from './components/FlashcardWidget.jsx'
import NoteWidget from './components/NoteWidget.jsx'
import ReadingListWidget from './components/ReadingListWidget.jsx'
import SidePanel from './components/SidePanel.jsx'
import AddModal from './components/AddModal.jsx'

const ReactGridLayout = WidthProvider(GridLayout)
const baseLayout = [
  { i: 'translator-1', kind: 'translator', x: 0, y: 0, w: 3, h: 2, static: true },
  { i: 'history-1', kind: 'history', x: 0, y: 2, w: 1, h: 1, static: true }
]

export default function App() {
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelView, setPanelView] = useState('')
  const [panelMode, setPanelMode] = useState('right')
  const [editMode, setEditMode] = useState(false)
  const [addPos, setAddPos] = useState({ x: 0, y: 0 })
  const [addOpen, setAddOpen] = useState(false)
  const [penaltyActive, setPenaltyActive] = useState(false)
  const [currentFlashcardId, setCurrentFlashcardId] = useState(null)
  const [layout, setLayout] = useState(() => {
    try {
      const raw = localStorage.getItem('rglLayout')
      const saved = raw ? JSON.parse(raw) : null
      const init = Array.isArray(saved) && saved.length ? saved : baseLayout
      return init.map(it => {
        if (it && !it.kind) {
          const base = String(it.i || '')
          const k = base.split('-')[0]
          if (k === 'translator' || k === 'history' || k === 'weather' || k === 'datetime' || k === 'hackernews' || k === 'todo' || k === 'flashcard') {
            return { ...it, kind: k }
          }
        }
        return it
      })
    } catch { return baseLayout }
  })
  const computedLayout = useMemo(() => {
    const base = layout.filter(it => it.i !== '__add__').map(it => ({ ...it, static: !editMode }))
    if (!editMode) return base
    const cols = 6
    const colHeights = new Array(cols).fill(0)
    base.forEach(it => {
      const endX = Math.min(it.x + it.w, cols)
      const bottomY = it.y + it.h
      for (let x = it.x; x < endX; x++) {
        if (x >= 0 && x < cols) {
          colHeights[x] = Math.max(colHeights[x], bottomY)
        }
      }
    })
    let minHeight = colHeights[0]
    let minCol = 0
    for (let i = 1; i < cols; i++) {
      if (colHeights[i] < minHeight) {
        minHeight = colHeights[i]
        minCol = i
      }
    }
    const addSlot = { i: '__add__', x: minCol, y: minHeight, w: 1, h: 1, static: true }
    return [...base, addSlot]
  }, [layout, editMode])
  const renderItem = (kind, w = 1, h = 1, widgetId = null) => {
    if (kind === 'history') return (
      <div className={`widget-inner ${penaltyActive ? 'penalty-disabled' : ''}`}>
        <div className="widget-title">历史记录</div>
        <div className="widget-sub">{penaltyActive ? '有任务逾期，请先完成任务' : '点击查看最近访问'}</div>
      </div>
    )
    if (kind === 'translator') return <TranslatorWidget />
    if (kind === 'weather') return <WeatherWidget />
    if (kind === 'datetime') return <DateTimeWidget />
    if (kind === 'hackernews') return <HackerNewsWidget />
    if (kind === 'todo') return <TodoWidget onPenaltyChange={setPenaltyActive} />
    if (kind === 'flashcard') return <FlashcardWidget size={`${w}x${h}`} widgetId={widgetId} onOpenSettings={() => { setPanelView('flashcard-settings'); setPanelMode('right'); setPanelOpen(true); setCurrentFlashcardId(widgetId) }} />
    if (kind === 'note') return <NoteWidget widgetId={widgetId} />
    if (kind === 'readinglist') return <ReadingListWidget size={`${w}x${h}`} />
    return <div className="widget-inner"></div>
  }
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setEditMode(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  useEffect(() => {
    try { document.body.classList.toggle('edit-mode', !!editMode) } catch {}
  }, [editMode])
  useEffect(() => {
    const onMsg = (e) => {
      const msg = e?.data
      if (!msg || typeof msg !== 'object') return
      if (msg.type === 'addWidgetAt') {
        const { kind, w = 1, h = 1 } = msg
        const clamp = (k, ww, hh) => {
          if (k === 'history') return { w: 1, h: 1 }
          if (k === 'translator') {
            const ok = (ww === 2 && hh === 2) || (ww === 3 && hh === 2)
            return ok ? { w: ww, h: hh } : { w: 3, h: 2 }
          }
          if (k === 'weather') {
            return { w: 2, h: 2 }
          }
          if (k === 'datetime') {
            return { w: 1, h: 1 }
          }
          if (k === 'hackernews') {
            const ok = (ww === 2 && hh === 2) || (ww === 3 && hh === 2)
            return ok ? { w: ww, h: hh } : { w: 2, h: 2 }
          }
          if (k === 'todo') {
            return { w: 2, h: 2 }
          }
          if (k === 'flashcard') {
            const ok = (ww === 1 && hh === 1) || (ww === 2 && hh === 2) || (ww === 3 && hh === 2)
            return ok ? { w: ww, h: hh } : { w: 1, h: 1 }
          }
          if (k === 'note') {
            const ok = (ww === 2 && hh === 2) || (ww === 3 && hh === 2)
            return ok ? { w: ww, h: hh } : { w: 2, h: 2 }
          }
          if (k === 'readinglist') {
            const ok = (ww === 2 && hh === 1) || (ww === 2 && hh === 2)
            return ok ? { w: ww, h: hh } : { w: 2, h: 1 }
          }
          return { w: ww, h: hh }
        }
        const size = clamp(kind, w, h)
        setLayout(prev => {
          let next = prev.filter(x => x.i !== '__add__')
          const count = next.filter(x => x.kind === kind).length
          const nid = `${kind}-${count + 1}-${Date.now()}`
          next = [...next, { i: nid, kind, x: addPos.x, y: addPos.y, w: size.w, h: size.h, static: !editMode }]
          try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
          return next
        })
        setPanelOpen(false)
      } else if (msg.type === 'closePanel') {
        setPanelOpen(false)
      }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [editMode, addPos])
  useEffect(() => {
    const onCtx = (e) => {
      if (!editMode) return
      e.preventDefault()
      setEditMode(false)
    }
    window.addEventListener('contextmenu', onCtx)
    return () => window.removeEventListener('contextmenu', onCtx)
  }, [editMode])
  return (
    <main className="page" style={{ maxWidth: 1000, margin: '6vh auto', padding: '120px 16px 32px' }}>
      <SearchBar disabled={penaltyActive} />
      <ReactGridLayout
        className={`widgets ${editMode ? 'drag-active' : ''}`}
        cols={6}
        layout={computedLayout}
        rowHeight={144}
        margin={[16, 16]}
        isResizable={false}
        isDraggable={editMode}
        draggableCancel=".remove-btn, .widget-inner button, .widget-inner input, .widget-inner textarea, .widget-inner select"
        compactType={null}
        preventCollision
        onDragStop={l => {
          const next = (l || []).filter(x => x.i && x.i !== '__add__')
          setLayout(next)
          try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
        }}
        onResizeStop={l => {
          const next = (l || []).filter(x => x.i && x.i !== '__add__')
          setLayout(next)
          try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
        }}
        onLayoutChange={l => {
          const next = (l || []).filter(x => x.i && x.i !== '__add__')
          setLayout(next)
          try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
        }}
        style={{ position: 'relative', maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}
      >
        {computedLayout.map(it => {
          const kind = it.kind || String(it.i || '').split('-')[0]
          const isHistory = kind === 'history';
          return (
            <div
              key={it.i}
              data-grid={it}
              className={`widget ${it.i === '__add__' ? 'add-slot' : ''}`}
              style={isHistory ? { cursor: 'pointer' } : undefined}
              onClick={
                it.i === '__add__'
                  ? () => { setAddPos({ x: it.x, y: it.y }); setAddOpen(true) }
                  : (!editMode && isHistory && !penaltyActive ? () => { setPanelView('history'); setPanelMode('right'); setPanelOpen(true) } : undefined)
              }
              role={isHistory ? 'button' : undefined}
              tabIndex={isHistory ? 0 : undefined}
              aria-expanded={isHistory ? (panelOpen ? 'true' : 'false') : undefined}
            >
              {it.i === '__add__'
                ? <div className="add-inner">+</div>
                : <>
                    {editMode && <button className="remove-btn" type="button" onMouseDown={(e)=>{ e.stopPropagation(); e.preventDefault(); }} onClick={(e) => {
                      e.stopPropagation()
                      setLayout(prev => {
                        const next = prev.filter(x => x.i !== it.i && x.i !== '__add__')
                        try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
                        return next
                      })
                    }}>−</button>}
                    {renderItem(kind, it.w, it.h, it.i)}
                  </>}
            </div>
          )
        })}
      </ReactGridLayout>
      <button
        id="edit-toggle"
        className="edit-fab"
        aria-label="编辑布局"
        title={editMode ? '退出编辑' : '编辑布局'}
        onClick={() => setEditMode(m => !m)}
        onContextMenu={e => { 
          e.preventDefault(); 
          if (editMode) { 
            setEditMode(false) 
          } else { 
            setPanelView('components'); 
            setPanelMode('right');
            setPanelOpen(true) 
          } 
        }}
      >⚙</button>
      <SidePanel
        open={panelOpen}
        view={panelView}
        mode={panelMode}
        onClose={() => setPanelOpen(false)}
        onOpenSettings={() => { setPanelView('history-settings'); setPanelOpen(true) }}
        onBackToHistory={() => { setPanelView('history'); setPanelOpen(true) }}
        widgetId={currentFlashcardId}
      />
      <AddModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSelect={(kind, w, h) => {
          const clamp = (k, ww, hh) => {
            if (k === 'history') return { w: 1, h: 1 }
            if (k === 'translator') {
              const ok = (ww === 2 && hh === 2) || (ww === 3 && hh === 2)
              return ok ? { w: ww, h: hh } : { w: 3, h: 2 }
            }
            return { w: ww, h: hh }
          }
          const size = clamp(kind, w, h)
          setLayout(prev => {
            let next = prev.filter(x => x.i !== '__add__')
            const count = next.filter(x => x.kind === kind).length
            const nid = `${kind}-${count + 1}-${Date.now()}`
            next = [...next, { i: nid, kind, x: addPos.x, y: addPos.y, w: size.w, h: size.h, static: !editMode }]
            try { localStorage.setItem('rglLayout', JSON.stringify(next)) } catch {}
            return next
          })
          setAddOpen(false)
        }}
      />
    </main>
  )
}
