import React from 'react'
import HistoryView from '../views/HistoryView'
import HistorySettingsView from '../views/HistorySettingsView'
import QuoteSettingsView from '../views/QuoteSettingsView'
import FlashcardSettingsView from '../views/FlashcardSettingsView'

const VIEW_COMPONENTS = {
  'history': HistoryView,
  'history-settings': HistorySettingsView,
  'quote-settings': QuoteSettingsView,
  'flashcard-settings': FlashcardSettingsView,
}

export default function SidePanel({ open, view, onClose, mode = 'right', onBackToHistory, ...props }) {
  const ViewComponent = VIEW_COMPONENTS[view]

  return (
    <>
      <div
        id="panel-overlay"
        className={`panel-overlay ${open ? 'show' : ''}`}
        aria-hidden={!open}
        onClick={onClose}
      ></div>
      <aside
        id="history-panel"
        className={`side-panel ${mode === 'center' ? 'center' : ''} ${mode === 'left' ? 'left' : ''} ${open ? 'open' : ''}`}
        aria-hidden={!open}
      >
        <div className="panel-body">
          {ViewComponent && open ? (
            <ViewComponent {...props} onClose={onClose} onBack={onBackToHistory} />
          ) : null}
        </div>
      </aside>
    </>
  )
}
