import React from 'react'

export default function HistoryPanel({ open, onClose }) {
  return (
    <>
      <div id="panel-overlay" className={`panel-overlay ${open ? 'show' : ''}`} aria-hidden={!open} onClick={onClose}></div>
      <aside id="history-panel" className={`side-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
        <div className="panel-header">
          <div className="panel-title"></div>
        </div>
        <div className="panel-body">
          <iframe id="history-frame" title="历史记录页面" src={open ? 'history.html' : 'about:blank'}></iframe>
        </div>
      </aside>
    </>
  )
}
