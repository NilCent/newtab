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
  const cursorSetRef = useRef(false)

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
    if (isEditing && textareaRef.current && !cursorSetRef.current) {
      textareaRef.current.focus()
      
      if (clickPosition !== null) {
        const pos = Math.min(clickPosition, content.length)
        textareaRef.current.setSelectionRange(pos, pos)
      } else {
        textareaRef.current.setSelectionRange(content.length, content.length)
      }
      setClickPosition(null)
      cursorSetRef.current = true
    }
  }, [isEditing, clickPosition, content.length])

  const handleContentClick = (e) => {
    cursorSetRef.current = false
    if (!contentRef.current) {
      setIsEditing(true)
      return
    }
    
    let position = content.length
    
    if (content.length > 0 && document.caretRangeFromPoint) {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY)
      
      if (range) {
        const startContainer = range.startContainer
        const startOffset = range.startOffset
        
        if (contentRef.current.contains(startContainer)) {
          const treeWalker = document.createTreeWalker(
            contentRef.current,
            NodeFilter.SHOW_TEXT,
            null,
            false
          )
          
          let charCount = 0
          
          while (treeWalker.nextNode()) {
            const node = treeWalker.currentNode
            if (node === startContainer) {
              position = charCount + startOffset
              break
            }
            charCount += node.textContent.length
          }
        }
      }
    }
    
    setClickPosition(position)
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
