import React, { useState, useEffect, useCallback } from 'react'
import { getSyncData, setSyncData, removeSyncData, onSyncChange } from '../utils/syncStorage'
import { notifyWidgetNoteMapChanged } from '../components/NoteWidget'

const NOTES_LIST_KEY = 'notes-list'

const getLocalData = (key) => {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

const setLocalData = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

export default function NoteSettingsView({ widgetId, onClose }) {
  const [notes, setNotes] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [notePreviews, setNotePreviews] = useState({})
  const [noteLineCounts, setNoteLineCounts] = useState({})
  const [selectedNoteId, setSelectedNoteId] = useState(null)

  const loadNotes = useCallback(async () => {
    const list = await getSyncData(NOTES_LIST_KEY) || []
    setNotes(list)
    
    const previews = {}
    const lineCounts = {}
    for (const note of list) {
      const content = await getSyncData(note.id) || ''
      const allLines = content.split('\n')
      const lines = allLines.slice(0, 5)
      previews[note.id] = lines
      lineCounts[note.id] = allLines.length
    }
    setNotePreviews(previews)
    setNoteLineCounts(lineCounts)
    
    const widgetNoteMap = getLocalData('widget-note-map') || {}
    setSelectedNoteId(widgetNoteMap[widgetId] || null)
    setLoaded(true)
  }, [widgetId])

  useEffect(() => {
    loadNotes()
    
    const unsubscribe = onSyncChange(NOTES_LIST_KEY, () => {
      loadNotes()
    })
    
    const unsubscribeContent = onSyncChange(selectedNoteId || '', () => {
      loadNotes()
    })
    
    return () => {
      unsubscribe()
      unsubscribeContent()
    }
  }, [loadNotes, selectedNoteId])

  const handleCreateNote = async () => {
    if (!loaded) return
    
    const newNote = {
      id: `note-${Date.now()}`,
      createdAt: Date.now()
    }
    
    const updatedNotes = [...notes, newNote]
    await setSyncData(NOTES_LIST_KEY, updatedNotes)
    await setSyncData(newNote.id, '')
    
    const widgetNoteMap = getLocalData('widget-note-map') || {}
    widgetNoteMap[widgetId] = newNote.id
    setLocalData('widget-note-map', widgetNoteMap)
    
    notifyWidgetNoteMapChanged()
    onClose?.()
  }

  const handleSelectNote = async (noteId) => {
    const widgetNoteMap = getLocalData('widget-note-map') || {}
    widgetNoteMap[widgetId] = noteId
    setLocalData('widget-note-map', widgetNoteMap)
    setSelectedNoteId(noteId)
    
    notifyWidgetNoteMapChanged()
    onClose?.()
  }

  const handleDeleteNote = async (noteId, e) => {
    e.stopPropagation()
    if (!loaded) return
    
    const updatedNotes = notes.filter(n => n.id !== noteId)
    await setSyncData(NOTES_LIST_KEY, updatedNotes)
    await removeSyncData(noteId)
    
    const widgetNoteMap = getLocalData('widget-note-map') || {}
    Object.keys(widgetNoteMap).forEach(wid => {
      if (widgetNoteMap[wid] === noteId) {
        delete widgetNoteMap[wid]
      }
    })
    setLocalData('widget-note-map', widgetNoteMap)
    
    notifyWidgetNoteMapChanged()
    setNotes(updatedNotes)
    if (selectedNoteId === noteId) {
      setSelectedNoteId(null)
    }
  }

  const currentNoteContent = selectedNoteId ? (notePreviews[selectedNoteId] || []).join('').trim() : ''
  const currentNoteIsEmpty = !currentNoteContent
  const showCreateButton = !selectedNoteId || !currentNoteIsEmpty

  return (
    <div className="note-settings-view">
      <div className="panel-header">
        <h3>便签设置</h3>
        <button className="panel-close-btn" onClick={onClose}>×</button>
      </div>
      
      <div className="note-settings-content">
        {!loaded ? (
          <div className="note-loading">加载中...</div>
        ) : (
          <>
            {showCreateButton && (
              <div className="note-create-section">
                <button className="btn-create-note" onClick={handleCreateNote}>
                  新建便签
                </button>
              </div>
            )}
            
            <div className="note-list-section">
              <h4>已有便签</h4>
              {notes.length === 0 ? (
                <div className="note-empty">暂无便签，点击上方按钮创建</div>
              ) : (
                <div className="note-list">
                  {notes.map(note => {
                    const lines = notePreviews[note.id] || []
                    const totalLines = noteLineCounts[note.id] || 0
                    const hasMore = totalLines > 5
                    
                    return (
                      <div
                        key={note.id}
                        className={`note-item ${selectedNoteId === note.id ? 'selected' : ''}`}
                        onClick={() => handleSelectNote(note.id)}
                      >
                        <div className="note-item-info">
                          <div className="note-item-preview">
                            {lines.map((line, i) => (
                              <div key={i} className="note-preview-line">
                                {line || '\u00A0'}
                                {i === 4 && hasMore && '...'}
                              </div>
                            ))}
                          </div>
                          <span className="note-item-date">
                            {new Date(note.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          className="note-delete-btn"
                          onClick={(e) => handleDeleteNote(note.id, e)}
                          title="删除便签"
                        >
                          ×
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
