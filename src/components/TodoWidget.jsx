import React, { useState, useEffect, useCallback } from 'react'
import TodoEditCard from './TodoEditCard.jsx'
import { getSyncData, setSyncData, onSyncChange } from '../utils/syncStorage'

const STORAGE_KEY = 'todoData'

const getLocalDateStr = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function TodoWidget({ onPenaltyChange }) {
  const [todos, setTodos] = useState([])
  const [editCard, setEditCard] = useState({ open: false, todo: null, section: null })

  useEffect(() => {
    getSyncData(STORAGE_KEY).then(saved => {
      if (saved) {
        setTodos(saved)
      }
    })
    
    const unsubscribe = onSyncChange(STORAGE_KEY, (newData) => {
      if (newData) {
        setTodos(newData)
      }
    })
    
    return unsubscribe
  }, [])

  const saveTodos = useCallback(async (newTodos) => {
    setTodos(newTodos)
    await setSyncData(STORAGE_KEY, newTodos)
  }, [])

  const isToday = (dateStr) => {
    if (!dateStr) return false
    const todayStr = getLocalDateStr(new Date())
    return todayStr === dateStr
  }

  const isWithinSevenDays = (dateStr) => {
    if (!dateStr) return false
    const today = new Date()
    const todayStr = getLocalDateStr(today)
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const tomorrowStr = getLocalDateStr(tomorrow)
    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(today.getDate() + 7)
    const sevenDaysLaterStr = getLocalDateStr(sevenDaysLater)
    return dateStr >= tomorrowStr && dateStr <= sevenDaysLaterStr
  }

  const isOverdue = (todo) => {
    const effectiveDeadline = getEffectiveDeadline(todo)
    if (!effectiveDeadline) return false
    
    const now = new Date()
    const deadlineDate = new Date(effectiveDeadline)
    
    if (todo.deadlineTime) {
      const [hours, minutes] = todo.deadlineTime.split(':').map(Number)
      deadlineDate.setHours(hours, minutes, 0, 0)
    } else {
      deadlineDate.setHours(23, 59, 59, 999)
    }
    
    return now > deadlineDate
  }

  const isCompleted = (todo) => {
    if (todo.type === 'counter') {
      return todo.current >= todo.target
    }
    return todo.completed
  }

  const getNextOccurrence = (todo) => {
    if (todo.repeat === 'none') return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (todo.repeat === 'daily') {
      if (!todo.completedAt) {
        return today
      }
      const lastCompletedDate = new Date(todo.completedAt)
      lastCompletedDate.setHours(0, 0, 0, 0)
      const nextDate = new Date(lastCompletedDate)
      nextDate.setDate(lastCompletedDate.getDate() + 1)
      return nextDate
    }
    if (todo.repeat === 'weekly' && todo.repeatDays?.length > 0) {
      const todayDay = today.getDay()
      
      if (!todo.completedAt) {
        if (todo.repeatDays.includes(todayDay)) {
          return today
        }
        const nextDay = todo.repeatDays.find(day => day > todayDay)
        if (nextDay !== undefined) {
          const nextDate = new Date(today)
          nextDate.setDate(today.getDate() + (nextDay - todayDay))
          return nextDate
        } else {
          const nextDate = new Date(today)
          nextDate.setDate(today.getDate() + (todo.repeatDays[0] - todayDay + 7))
          return nextDate
        }
      }
      
      const lastCompletedDate = new Date(todo.completedAt)
      lastCompletedDate.setHours(0, 0, 0, 0)
      const lastCompletedDay = lastCompletedDate.getDay()
      
      const nextDay = todo.repeatDays.find(day => day > lastCompletedDay)
      if (nextDay !== undefined) {
        const nextDate = new Date(lastCompletedDate)
        nextDate.setDate(lastCompletedDate.getDate() + (nextDay - lastCompletedDay))
        return nextDate
      } else {
        const nextDate = new Date(lastCompletedDate)
        nextDate.setDate(lastCompletedDate.getDate() + (todo.repeatDays[0] - lastCompletedDay + 7))
        return nextDate
      }
    }
    return null
  }

  const getEffectiveDeadline = (todo) => {
    if (todo.repeat === 'none') {
      return todo.deadline
    }
    const nextOccurrence = getNextOccurrence(todo)
    if (!nextOccurrence) return null
    return getLocalDateStr(nextOccurrence)
  }

  const categorizeTodos = (todos) => {
    const overdue = []
    const today = []
    const sevenDays = []
    const planned = []

    todos.forEach(todo => {
      if (isCompleted(todo)) return
      
      const effectiveDeadline = getEffectiveDeadline(todo)
      
      if (isOverdue(todo)) {
        overdue.push(todo)
      } else if (isToday(effectiveDeadline)) {
        today.push(todo)
      } else if (isWithinSevenDays(effectiveDeadline)) {
        sevenDays.push(todo)
      } else {
        planned.push(todo)
      }
    })

    return { overdue, today, sevenDays, planned }
  }

  const handleToggle = (todoId) => {
    const newTodos = todos.map(todo => {
      if (todo.id === todoId) {
        if (todo.repeat !== 'none') {
          const effectiveDeadline = getEffectiveDeadline(todo)
          const effectiveDate = new Date(effectiveDeadline)
          effectiveDate.setHours(0, 0, 0, 0)
          const completedAt = effectiveDate.getTime()
          
          if (todo.type === 'counter') {
            const newCurrent = Math.min(todo.current + 1, todo.target)
            if (newCurrent >= todo.target) {
              return { ...todo, current: 0, completedAt }
            }
            return { ...todo, current: newCurrent }
          }
          return { ...todo, completedAt }
        }
        if (todo.type === 'counter') {
          const newCurrent = Math.min(todo.current + 1, todo.target)
          if (newCurrent >= todo.target) {
            return { ...todo, current: newCurrent, completed: true, completedAt: Date.now() }
          }
          return { ...todo, current: newCurrent }
        }
        return { ...todo, completed: true, completedAt: Date.now() }
      }
      return todo
    })
    saveTodos(newTodos)
  }

  const handleAddClick = (section) => {
    setEditCard({ open: true, todo: null, section })
  }

  const handleTodoClick = (todo) => {
    setEditCard({ open: true, todo, section: null })
  }

  const handleSave = (todoData) => {
    let newTodos
    if (editCard.todo) {
      newTodos = todos.map(t => t.id === todoData.id ? todoData : t)
    } else {
      newTodos = [...todos, { ...todoData, id: Date.now().toString() }]
    }
    saveTodos(newTodos)
    setEditCard({ open: false, todo: null, section: null })
  }

  const handleDelete = (todoId) => {
    const newTodos = todos.filter(t => t.id !== todoId)
    saveTodos(newTodos)
    setEditCard({ open: false, todo: null, section: null })
  }

  const handleClose = () => {
    setEditCard({ open: false, todo: null, section: null })
  }

  const { overdue, today, sevenDays, planned } = categorizeTodos(todos)

  useEffect(() => {
    const hasPenaltyOverdue = overdue.some(todo => todo.penalty && isOverdue(todo))
    onPenaltyChange?.(hasPenaltyOverdue)
  }, [overdue, onPenaltyChange])

  const handleWheel = (e) => {
    e.stopPropagation()
  }

  const renderSection = (title, items, sectionKey, isOverdueSection = false) => (
    <div className="todo-section">
      <div className={`todo-section-header ${isOverdueSection ? 'overdue' : ''}`}>{title}</div>
      {items.map(todo => {
        const effectiveDeadline = getEffectiveDeadline(todo)
        const showDeadline = sectionKey !== 'today' && effectiveDeadline && todo.repeat !== 'none'
        const showRepeatLabel = sectionKey !== 'today' && todo.repeat !== 'none'
        
        return (
          <div key={todo.id} className="todo-item" onClick={() => handleTodoClick(todo)}>
            <div 
              className={`todo-checkbox ${isCompleted(todo) ? 'completed' : ''}`}
              onClick={(e) => { e.stopPropagation(); handleToggle(todo.id) }}
            >
              {todo.type === 'counter' ? (
                <span className="todo-counter">{todo.current}/{todo.target}</span>
              ) : (
                isCompleted(todo) && <span className="todo-check">✓</span>
              )}
            </div>
            <div className="todo-content">
              <span className={`todo-text ${isCompleted(todo) ? 'completed' : ''} ${isOverdueSection ? 'overdue' : ''}`}>{todo.title}</span>
              {(todo.deadline || todo.deadlineTime || showRepeatLabel || showDeadline) && (
                <div className={`todo-meta ${isOverdueSection ? 'overdue' : ''}`}>
                  {todo.repeat === 'none' && todo.deadline && (
                    <span className="todo-deadline">{formatDeadline(todo.deadline)}</span>
                  )}
                  {showDeadline && (
                    <span className="todo-deadline">{formatDeadline(effectiveDeadline)}</span>
                  )}
                  {todo.deadlineTime && (
                    <span className="todo-time">{todo.deadlineTime}</span>
                  )}
                  {showRepeatLabel && todo.repeat === 'daily' && (
                    <span className="todo-repeat">每日</span>
                  )}
                  {showRepeatLabel && todo.repeat === 'weekly' && todo.repeatDays?.length > 0 && (
                    <span className="todo-repeat">每周{formatRepeatDays(todo.repeatDays)}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}
      {!isOverdueSection && (
        <div className="todo-spacer" onClick={() => handleAddClick(sectionKey)}>
          <span className="todo-spacer-hint">+ 添加任务</span>
        </div>
      )}
    </div>
  )

  const formatDeadline = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return '今天'
    if (date.toDateString() === tomorrow.toDateString()) return '明天'
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const formatRepeatDays = (days) => {
    const weekdays = ['日', '一', '二', '三', '四', '五', '六']
    return days.map(d => weekdays[d]).join('')
  }

  return (
    <div className="widget-inner todo-widget">
      <div className="todo-header">
        <span className="todo-title">待办事项</span>
      </div>
      <div className="todo-list" onWheel={handleWheel}>
        {overdue.length > 0 && renderSection('逾期', overdue, 'overdue', true)}
        {renderSection('今天', today, 'today')}
        {renderSection('七日内', sevenDays, 'sevenDays')}
        {renderSection('计划', planned, 'planned')}
      </div>
      {editCard.open && (
        <TodoEditCard
          todo={editCard.todo}
          section={editCard.section}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
