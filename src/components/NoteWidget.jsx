import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getSyncData, setSyncData, onSyncChange } from '../utils/syncStorage'

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

const WIDGET_NOTE_MAP_KEY = 'widget-note-map'

export function notifyWidgetNoteMapChanged() {
  window.dispatchEvent(new CustomEvent('widgetNoteMapChanged'))
}

export default function NoteWidget({ widgetId, onOpenSettings }) {
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [noteId, setNoteId] = useState(null)
  const textareaRef = useRef(null)

  const loadNote = useCallback(async () => {
    const widgetNoteMap = getLocalData(WIDGET_NOTE_MAP_KEY) || {}
    const currentNoteId = widgetNoteMap[widgetId]
    setNoteId(currentNoteId)
    
    if (currentNoteId) {
      const noteContent = await getSyncData(currentNoteId) || ''
      setContent(noteContent)
    } else {
      setContent('')
    }
  }, [widgetId])

  useEffect(() => {
    loadNote()
    
    const unsub = onSyncChange('notes-list', loadNote)
    
    const handleWidgetNoteMapChange = () => {
      loadNote()
    }
    window.addEventListener('widgetNoteMapChanged', handleWidgetNoteMapChange)
    
    return () => {
      unsub()
      window.removeEventListener('widgetNoteMapChanged', handleWidgetNoteMapChange)
    }
  }, [loadNote])

  useEffect(() => {
    if (noteId) {
      const unsub = onSyncChange(noteId, (newContent) => {
        if (newContent !== null) setContent(newContent)
      })
      return unsub
    }
  }, [noteId])

  const handleSave = async () => {
    if (noteId) {
      await setSyncData(noteId, content)
    }
    setIsEditing(false)
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  const handleContextMenu = (e) => {
    e.preventDefault()
    onOpenSettings?.()
  }

  if (!noteId) {
    return (
      <div 
        className="widget-inner note-widget note-unconfigured"
        onContextMenu={handleContextMenu}
      >
        <div className="note-unconfigured-text">暂无便签，右键打开设置</div>
      </div>
    )
  }

  return (
    <div 
      className="widget-inner note-widget"
      onContextMenu={handleContextMenu}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleSave}
          placeholder="在这里写点什么..."
        />
      ) : (
        <div className="note-content" onClick={() => setIsEditing(true)}>
          {content || <span className="note-placeholder">点击编辑...</span>}
        </div>
      )}
    </div>
  )
}
