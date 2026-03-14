import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  loadWidgetConfig,
  saveWidgetConfig,
  clearWidgetConfig,
  checkPermission,
  selectDirectory,
  selectFile,
  loadFlashcardFiles
} from '../utils/flashcardStorage'
import { parseFlashcards } from '../utils/flashcardParser'

export default function FlashcardSettingsView({ onClose, widgetId }) {
  const [handle, setHandle] = useState(null)
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState(null)
  const [status, setStatus] = useState('idle')
  const [fileCount, setFileCount] = useState(0)
  const [cardCount, setCardCount] = useState(0)
  const [error, setError] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const loadSavedConfig = useCallback(async () => {
    if (!widgetId) return
    
    try {
      const config = await loadWidgetConfig(widgetId)
      
      if (config && config.handle) {
        setHandle(config.handle)
        setSourceName(config.name || config.handle.name)
        setSourceType(config.sourceType || (config.handle.kind === 'directory' ? 'directory' : 'file'))
        
        const { granted } = await checkPermission(config.handle)
        if (granted) {
          setStatus('ready')
          await loadCardsFromHandle(config.handle)
        } else {
          setStatus('need-permission')
        }
      } else {
        setStatus('no-config')
      }
    } catch (e) {
      console.error('Failed to load saved config:', e)
      setStatus('no-config')
    }
  }, [widgetId])

  const loadCardsFromHandle = async (h) => {
    try {
      const files = await loadFlashcardFiles(h)
      setFileCount(files.length)
      
      let totalCards = 0
      for (const file of files) {
        const cards = parseFlashcards(file.content, file.path)
        totalCards += cards.length
      }
      setCardCount(totalCards)
      
      window.dispatchEvent(new CustomEvent('flashcard-refresh', { detail: { widgetId } }))
    } catch (e) {
      console.error('Failed to load cards:', e)
      setError('加载卡片失败: ' + e.message)
    }
  }

  useEffect(() => {
    loadSavedConfig()
  }, [loadSavedConfig])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectSource = async (type) => {
    setShowDropdown(false)
    setError('')
    setStatus('selecting')
    
    const result = type === 'directory' ? await selectDirectory() : await selectFile()
    
    if (result.success) {
      const config = {
        sourceType: type,
        handle: result.handle,
        name: result.name
      }
      
      await saveWidgetConfig(widgetId, config)
      setHandle(result.handle)
      setSourceName(result.name)
      setSourceType(type)
      setStatus('ready')
      await loadCardsFromHandle(result.handle)
    } else if (result.error !== 'cancelled') {
      setError(`选择${type === 'directory' ? '目录' : '文件'}失败: ${result.error}`)
      setStatus('error')
    } else {
      setStatus(handle ? 'ready' : 'no-config')
    }
  }

  const handleRequestPermission = async () => {
    if (!handle) return
    
    setError('')
    try {
      const { granted } = await checkPermission(handle)
      if (granted) {
        const config = await loadWidgetConfig(widgetId)
        config.handle = handle
        await saveWidgetConfig(widgetId, config)
        setStatus('ready')
        await loadCardsFromHandle(handle)
      } else {
        setError('权限被拒绝')
      }
    } catch (e) {
      setError('请求权限失败: ' + e.message)
    }
  }

  const handleClearConfig = async () => {
    try {
      await clearWidgetConfig(widgetId)
      setHandle(null)
      setSourceName('')
      setSourceType(null)
      setFileCount(0)
      setCardCount(0)
      setStatus('no-config')
      window.dispatchEvent(new CustomEvent('flashcard-refresh', { detail: { widgetId } }))
    } catch (e) {
      setError('清除配置失败: ' + e.message)
    }
  }

  const handleRefresh = async () => {
    if (!handle) return
    setError('')
    setStatus('loading')
    try {
      await loadCardsFromHandle(handle)
      setStatus('ready')
    } catch (e) {
      setError('刷新失败: ' + e.message)
      setStatus('error')
    }
  }

  const sourceIcon = sourceType === 'directory' ? '📁' : '📄'

  return (
    <div className="flashcard-settings-view">
      <div className="flashcard-settings-header">
        <div className="flashcard-settings-title">闪卡配置</div>
        <div className="flashcard-settings-actions">
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
      
      <div className="flashcard-settings-main">
        <div className="flashcard-settings-section">
          <div className="flashcard-settings-label">数据来源</div>
          
          {status === 'no-config' && (
            <div className="flashcard-settings-dropdown" ref={dropdownRef}>
              <button 
                className="btn primary flashcard-settings-select-btn"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                📂 选择目录或文件
              </button>
              {showDropdown && (
                <div className="flashcard-settings-dropdown-menu">
                  <button 
                    className="flashcard-settings-dropdown-item"
                    onClick={() => handleSelectSource('directory')}
                  >
                    <span className="flashcard-settings-dropdown-icon">📁</span>
                    <span>
                      <strong>选择目录</strong>
                      <small>扫描目录及子目录中所有 .md 文件</small>
                    </span>
                  </button>
                  <button 
                    className="flashcard-settings-dropdown-item"
                    onClick={() => handleSelectSource('file')}
                  >
                    <span className="flashcard-settings-dropdown-icon">📄</span>
                    <span>
                      <strong>选择文件</strong>
                      <small>只读取单个 .md 文件</small>
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {(status === 'ready' || status === 'loading' || status === 'need-permission') && (
            <div className="flashcard-settings-current">
              <div className="flashcard-settings-dir-info">
                <span className="flashcard-settings-dir-name">{sourceIcon} {sourceName}</span>
                {status === 'ready' && (
                  <span className="flashcard-settings-stats">
                    {fileCount} 个文件 · {cardCount} 张卡片
                  </span>
                )}
              </div>
              
              {status === 'need-permission' && (
                <button className="btn primary" onClick={handleRequestPermission}>
                  授权访问
                </button>
              )}
              
              {status === 'ready' && (
                <div className="flashcard-settings-actions-row">
                  <button 
                    className="btn" 
                    onClick={handleRefresh}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? '刷新中...' : '刷新'}
                  </button>
                  <div className="flashcard-settings-dropdown" ref={dropdownRef}>
                    <button 
                      className="btn"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      更换 ▾
                    </button>
                    {showDropdown && (
                      <div className="flashcard-settings-dropdown-menu">
                        <button 
                          className="flashcard-settings-dropdown-item"
                          onClick={() => handleSelectSource('directory')}
                        >
                          <span className="flashcard-settings-dropdown-icon">📁</span>
                          <span>选择目录</span>
                        </button>
                        <button 
                          className="flashcard-settings-dropdown-item"
                          onClick={() => handleSelectSource('file')}
                        >
                          <span className="flashcard-settings-dropdown-icon">📄</span>
                          <span>选择文件</span>
                        </button>
                      </div>
                    )}
                  </div>
                  <button className="btn danger" onClick={handleClearConfig}>
                    清除
                  </button>
                </div>
              )}
            </div>
          )}
          
          {status === 'selecting' && (
            <div className="flashcard-settings-hint">请选择...</div>
          )}
        </div>
        
        {error && (
          <div className="flashcard-settings-section">
            <div className="flashcard-settings-error">{error}</div>
          </div>
        )}
        
        <div className="flashcard-settings-sep"></div>
        
        <div className="flashcard-settings-section">
          <div className="flashcard-settings-label">Markdown 语法</div>
          <div className="flashcard-settings-help">
            <p><code>正面 {'>>>'} 反面</code> — 单行双面卡片</p>
            <p><code>::: 反面内容 :::</code> — 多行双面卡片</p>
            <p><code>***</code> — 分割多个单面卡片</p>
            <p><code># 标题</code> — 作为卡片标签</p>
          </div>
        </div>
      </div>
    </div>
  )
}
