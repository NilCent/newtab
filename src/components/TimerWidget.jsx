import React, { useState, useEffect, useRef, useCallback } from 'react'
import { sendMessage } from '../utils/syncStorage'

const TIMER_DEFAULT_KEY = 'timer-default-time'

const getStoredDefaultTime = () => {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get([TIMER_DEFAULT_KEY], (result) => {
        resolve(result[TIMER_DEFAULT_KEY] || { minutes: '25', seconds: '00' })
      })
    } else {
      const stored = localStorage.getItem(TIMER_DEFAULT_KEY)
      resolve(stored ? JSON.parse(stored) : { minutes: '25', seconds: '00' })
    }
  })
}

const setStoredDefaultTime = async (minutes, seconds) => {
  const value = { minutes, seconds }
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [TIMER_DEFAULT_KEY]: value }, resolve)
    })
  } else {
    localStorage.setItem(TIMER_DEFAULT_KEY, JSON.stringify(value))
  }
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function parseTimeToSeconds(minutes, seconds) {
  return (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0)
}

export default function TimerWidget() {
  const [totalSeconds, setTotalSeconds] = useState(0)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const [status, setStatus] = useState('idle')
  const [defaultTimeLoaded, setDefaultTimeLoaded] = useState(false)
  
  const intervalRef = useRef(null)
  const endTimeRef = useRef(null)
  const minutesRef = useRef(null)
  const secondsRef = useRef(null)
  const minutesValueRef = useRef('25')
  const secondsValueRef = useRef('00')

  useEffect(() => {
    getStoredDefaultTime().then(({ minutes, seconds }) => {
      minutesValueRef.current = minutes
      secondsValueRef.current = seconds
      if (minutesRef.current) minutesRef.current.textContent = minutes
      if (secondsRef.current) secondsRef.current.textContent = seconds
      setDefaultTimeLoaded(true)
    })
  }, [])

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    endTimeRef.current = null
  }, [])

  const showNotification = useCallback(async () => {
    try {
      await sendMessage('showNotification', {
        title: '定时器',
        message: '时间到！'
      })
    } catch (error) {
      console.error('[TimerWidget] Notification error:', error)
    }
  }, [])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  useEffect(() => {
    if (status === 'running' && remainingSeconds <= 0) {
      clearTimer()
      setStatus('idle')
      setTotalSeconds(0)
      setRemainingSeconds(0)
      if (minutesRef.current) minutesRef.current.textContent = minutesValueRef.current
      if (secondsRef.current) secondsRef.current.textContent = secondsValueRef.current
      showNotification()
    }
  }, [remainingSeconds, status, clearTimer, showNotification])

  const handleStart = () => {
    let secondsToRun = remainingSeconds
    
    if (status === 'idle' && totalSeconds === 0) {
      const minutes = minutesValueRef.current || '0'
      const seconds = secondsValueRef.current || '00'
      const secondsVal = parseTimeToSeconds(minutes, seconds)
      if (secondsVal <= 0) return
      setTotalSeconds(secondsVal)
      setRemainingSeconds(secondsVal)
      secondsToRun = secondsVal
    }
    
    if (secondsToRun <= 0) return
    
    setStatus('running')
    const endTime = Date.now() + secondsToRun * 1000
    endTimeRef.current = endTime
    
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const newRemaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000))
      setRemainingSeconds(newRemaining)
      
      if (newRemaining <= 0) {
        clearTimer()
        setStatus('idle')
        setTotalSeconds(0)
        if (minutesRef.current) minutesRef.current.textContent = minutesValueRef.current
        if (secondsRef.current) secondsRef.current.textContent = secondsValueRef.current
        showNotification()
      }
    }, 200)
  }

  const handlePause = () => {
    if (status !== 'running') return
    clearTimer()
    setStatus('paused')
  }

  const handleStop = () => {
    clearTimer()
    setStatus('idle')
    setTotalSeconds(0)
    setRemainingSeconds(0)
    if (minutesRef.current) minutesRef.current.textContent = minutesValueRef.current
    if (secondsRef.current) secondsRef.current.textContent = secondsValueRef.current
  }

  const handleMinutesBlur = () => {
    const text = minutesRef.current?.textContent.replace(/\D/g, '') || '0'
    minutesValueRef.current = text || '0'
    if (minutesRef.current) minutesRef.current.textContent = minutesValueRef.current
    const seconds = parseTimeToSeconds(minutesValueRef.current, secondsValueRef.current)
    setTotalSeconds(seconds)
    setRemainingSeconds(seconds)
    setStoredDefaultTime(minutesValueRef.current, secondsValueRef.current)
  }

  const handleSecondsBlur = () => {
    const text = secondsRef.current?.textContent.replace(/\D/g, '').slice(-2) || '00'
    secondsValueRef.current = text.padStart(2, '0')
    if (secondsRef.current) secondsRef.current.textContent = secondsValueRef.current
    const seconds = parseTimeToSeconds(minutesValueRef.current, secondsValueRef.current)
    setTotalSeconds(seconds)
    setRemainingSeconds(seconds)
    setStoredDefaultTime(minutesValueRef.current, secondsValueRef.current)
  }

  const handleMinutesKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      minutesRef.current?.blur()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      secondsRef.current?.focus()
    }
  }

  const handleSecondsKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      secondsRef.current?.blur()
    } else if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      minutesRef.current?.focus()
    }
  }

  const handleFocus = (ref) => {
    if (status === 'running') {
      ref.current?.blur()
      return
    }
    setTimeout(() => {
      const el = ref.current
      if (el) {
        const range = document.createRange()
        range.selectNodeContents(el)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }, 0)
  }

  const progress = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100
  const isRunning = status === 'running'
  const isPaused = status === 'paused'

  const displayMinutes = (isRunning || isPaused)
    ? Math.floor(remainingSeconds / 60)
    : minutesValueRef.current
  const displaySeconds = (isRunning || isPaused)
    ? (remainingSeconds % 60).toString().padStart(2, '0')
    : secondsValueRef.current.padStart(2, '0')

  return (
    <div className="widget-inner timer-widget">
      <div className="timer-time-area">
        <div className="timer-display">
          <div className="timer-time">
            <span
              ref={minutesRef}
              contentEditable={!isRunning}
              suppressContentEditableWarning
              onBlur={handleMinutesBlur}
              onKeyDown={handleMinutesKeyDown}
              onFocus={() => handleFocus(minutesRef)}
              className="timer-time-editable"
            >
              {displayMinutes}
            </span>
            <span className="timer-time-sep">:</span>
            <span
              ref={secondsRef}
              contentEditable={!isRunning}
              suppressContentEditableWarning
              onBlur={handleSecondsBlur}
              onKeyDown={handleSecondsKeyDown}
              onFocus={() => handleFocus(secondsRef)}
              className="timer-time-editable"
            >
              {displaySeconds}
            </span>
          </div>
          <div className="timer-progress">
            <div className="timer-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
      <div className="timer-buttons">
        {status === 'idle' || status === 'paused' ? (
          <button className="timer-btn timer-btn-start" onClick={handleStart} title="启动">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
        ) : (
          <button className="timer-btn timer-btn-pause" onClick={handlePause} title="暂停">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
          </button>
        )}
        <button className="timer-btn timer-btn-stop" onClick={handleStop} title="停止">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h12v12H6z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
