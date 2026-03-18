import React, { useState, useEffect, useRef } from 'react'
import { getSyncData, setSyncData, onSyncChange } from '../utils/syncStorage'

export default function NoteWidget({ widgetId }) {
  const [content, setContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    const key = `note-${widgetId}`
    getSyncData(key).then(saved => {
      if (saved) setContent(saved)
    })
    
    const unsubscribe = onSyncChange(key, (newData) => {
      if (newData !== null) setContent(newData)
    })
    
    return unsubscribe
  }, [widgetId])

  const handleSave = async () => {
    const key = `note-${widgetId}`
    await setSyncData(key, content)
    setIsEditing(false)
  }

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isEditing])

  return (
    <div 
      className="widget-inner note-widget"
      onClick={() => !isEditing && setIsEditing(true)}
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
        <div className="note-content">
          {content || <span className="note-placeholder">点击编辑...</span>}
        </div>
      )}
    </div>
  )
}
