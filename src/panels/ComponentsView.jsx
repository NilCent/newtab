import React from 'react'

const items = [
  { kind: 'history', title: '历史记录（1x1）', sub: '查看最近访问' },
  { kind: 'quote', title: '摘抄（3x2）', sub: '随机展示摘抄' },
  { kind: 'translator', title: '翻译（3x2）', sub: 'MyMemory 翻译' }
]

export default function ComponentsView({ existing = [], onAdd }) {
  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', height: '100%' }}>
      <div style={{ padding: 12, borderBottom: '1px solid var(--border)', fontWeight: 700 }}>可添加的组件</div>
      <div style={{ overflow: 'auto', padding: 12, display: 'grid', gap: 10 }}>
        {items.map(it => {
          const exists = existing.includes(it.kind)
          return (
            <div key={it.kind} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div>{it.title}</div>
                <div style={{ fontSize: 12, color: 'var(--subtle)' }}>{it.sub}</div>
              </div>
              <button
                className="btn"
                disabled={exists}
                onClick={() => onAdd?.(it.kind)}
                style={{ border: '1px solid var(--border)', background: '#fff', borderRadius: 10, padding: '6px 10px', fontWeight: 600, cursor: exists ? 'not-allowed' : 'pointer', opacity: exists ? .5 : 1 }}
              >
                加入页面
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
