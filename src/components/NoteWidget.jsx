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
  const [clickPosition, setClickPosition] = useState(null)
  const textareaRef = useRef(null)
  const contentRef = useRef(null)

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
      
      if (clickPosition !== null) {
        const pos = Math.min(clickPosition, content.length)
        textareaRef.current.setSelectionRange(pos, pos)
      } else {
        textareaRef.current.setSelectionRange(content.length, content.length)
      }
      setClickPosition(null)
    }
  }, [isEditing, clickPosition, content.length])

  const handleContentClick = (e) => {
    if (!contentRef.current) {
      setIsEditing(true)
      return
    }
    
    const rect = contentRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    const lineHeight = parseInt(getComputedStyle(contentRef.current).lineHeight) || 20
    const fontSize = parseInt(getComputedStyle(contentRef.current).fontSize) || 14
    const charWidth = fontSize * 0.6
    
    const lines = content.split('\n')
    let currentY = 0
    let charIndex = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const lineCount = Math.ceil((line.length * charWidth) / rect.width) || 1
      const lineStartY = currentY
      const lineEndY = currentY + lineCount * lineHeight
      
      if (y >= lineStartY && y < lineEndY) {
        const relativeY = y - lineStartY
        const rowInLine = Math.floor(relativeY / lineHeight)
        const charsPerRow = Math.floor(rect.width / charWidth)
        const charInRow = Math.floor(x / charWidth)
        const estimatedPos = charIndex + rowInLine * charsPerRow + charInRow
        setClickPosition(Math.min(estimatedPos, charIndex + line.length))
        break
      }
      
      charIndex += line.length + 1
      currentY = lineEndY
    }
    
    if (y >= currentY) {
      setClickPosition(content.length)
    }
    
    setIsEditing(true)
  }

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
        <div ref={contentRef} className="note-content" onClick={handleContentClick}>
          {content || <span className="note-placeholder">点击编辑...</span>}
        </div>
      )}
    </div>
  )
}
