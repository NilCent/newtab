import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const WEEKDAYS = [
  { key: 0, label: '日' },
  { key: 1, label: '一' },
  { key: 2, label: '二' },
  { key: 3, label: '三' },
  { key: 4, label: '四' },
  { key: 5, label: '五' },
  { key: 6, label: '六' },
]

export default function TodoEditCard({ todo, section, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('normal')
  const [target, setTarget] = useState(1)
  const [deadline, setDeadline] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('')
  const [repeat, setRepeat] = useState('none')
  const [repeatDays, setRepeatDays] = useState([])
  const [penalty, setPenalty] = useState(false)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    if (todo) {
      setTitle(todo.title || '')
      setType(todo.type || 'normal')
      setTarget(todo.target || 1)
      setDeadline(todo.deadline || '')
      setDeadlineTime(todo.deadlineTime || '20:00')
      setRepeat(todo.repeat || 'none')
      setRepeatDays(todo.repeatDays || [])
      setPenalty(todo.penalty || false)
    } else {
      const today = new Date()
      const year = today.getFullYear()
      const month = String(today.getMonth() + 1).padStart(2, '0')
      const day = String(today.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      const tomorrowYear = tomorrow.getFullYear()
      const tomorrowMonth = String(tomorrow.getMonth() + 1).padStart(2, '0')
      const tomorrowDay = String(tomorrow.getDate()).padStart(2, '0')
      const tomorrowStr = `${tomorrowYear}-${tomorrowMonth}-${tomorrowDay}`
      
      if (section === 'today') {
        setDeadline(todayStr)
      } else if (section === 'sevenDays') {
        setDeadline(tomorrowStr)
      }
      setDeadlineTime('20:00')
    }
  }, [todo, section])

  const handleRepeatDayToggle = (day) => {
    setRepeatDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const todoData = {
      id: todo?.id || Date.now().toString(),
      title: title.trim(),
      type,
      target: type === 'counter' ? parseInt(target) || 1 : 1,
      current: todo?.current || 0,
      completed: false,
      deadline: repeat === 'none' ? deadline : '',
      deadlineTime,
      repeat,
      repeatDays: repeat === 'weekly' ? repeatDays : [],
      penalty,
      createdAt: todo?.createdAt || Date.now(),
    }
    onSave(todoData)
  }

  const content = (
    <div className="todo-edit-overlay" onClick={onClose}>
      <div className="todo-edit-card" onClick={e => e.stopPropagation()}>
        <div className="todo-edit-header">
          <span>{todo ? '编辑任务' : '新建任务'}</span>
          <button className="todo-edit-close" onClick={onClose}>×</button>
        </div>
        <form className="todo-edit-form" onSubmit={handleSubmit}>
          <div className="todo-edit-field">
            <label>任务名称</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="输入任务名称"
              autoFocus
            />
          </div>

          <div className="todo-edit-field">
            <label>任务类型</label>
            <div className="todo-edit-type-btns">
              <button
                type="button"
                className={type === 'normal' ? 'active' : ''}
                onClick={() => setType('normal')}
              >
                普通任务
              </button>
              <button
                type="button"
                className={type === 'counter' ? 'active' : ''}
                onClick={() => setType('counter')}
              >
                计数器任务
              </button>
            </div>
          </div>

          {type === 'counter' && (
            <div className="todo-edit-field">
              <label>目标次数</label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={e => setTarget(e.target.value)}
              />
            </div>
          )}

          <div className="todo-edit-field">
            <label>重复</label>
            <select value={repeat} onChange={e => setRepeat(e.target.value)}>
              <option value="none">不重复</option>
              <option value="daily">每日一次</option>
              <option value="weekly">每周固定时间</option>
            </select>
          </div>

          {repeat === 'weekly' && (
            <div className="todo-edit-field">
              <label>重复日期</label>
              <div className="todo-edit-weekdays">
                {WEEKDAYS.map(day => (
                  <button
                    key={day.key}
                    type="button"
                    className={repeatDays.includes(day.key) ? 'active' : ''}
                    onClick={() => handleRepeatDayToggle(day.key)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {repeat === 'none' && (
            <div className="todo-edit-field">
              <label>截止日期</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
              />
            </div>
          )}

          <div className="todo-edit-field">
            <label>截止时间</label>
            <input
              type="time"
              value={deadlineTime}
              onChange={e => setDeadlineTime(e.target.value)}
            />
          </div>

          <div className="todo-edit-field todo-edit-penalty">
            <label>逾期惩罚</label>
            <div className="todo-edit-penalty-row">
              <button
                type="button"
                className={penalty ? 'active' : ''}
                onClick={() => setPenalty(true)}
              >
                开启
              </button>
              <button
                type="button"
                className={!penalty ? 'active' : ''}
                onClick={() => setPenalty(false)}
              >
                关闭
              </button>
            </div>
            <div className="todo-edit-penalty-hint">开启后，任务逾期将禁用搜索栏和历史记录</div>
          </div>

          <div className="todo-edit-actions">
            {todo && (
              <button type="button" className="todo-edit-delete" onClick={() => onDelete(todo.id)}>
                删除
              </button>
            )}
            <button type="submit" className="todo-edit-save">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
