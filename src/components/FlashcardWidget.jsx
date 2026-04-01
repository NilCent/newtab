import React, { useState, useEffect, useMemo, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { parseFlashcards } from '../utils/flashcardParser'
import { 
  loadWidgetConfig, 
  checkPermission, 
  loadFlashcardFiles 
} from '../utils/flashcardStorage'

const STORAGE_KEY_PREFIX = 'flashcardState_'

export default function FlashcardWidget({ size = '1x1', widgetId, onOpenSettings }) {
  const [cards, setCards] = useState([])
  const [shuffledCards, setShuffledCards] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [noTransition, setNoTransition] = useState(false)
  const [loading, setLoading] = useState(true)
  const [configStatus, setConfigStatus] = useState('no-config')

  const shuffleCards = useCallback((cardList) => {
    const shuffled = [...cardList]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const loadCards = useCallback(async () => {
    if (!widgetId) {
      setConfigStatus('no-config')
      setLoading(false)
      return
    }
    
    setLoading(true)
    try {
      const config = await loadWidgetConfig(widgetId)
      
      if (!config || !config.handle) {
        setCards([])
        setShuffledCards([])
        setConfigStatus('no-config')
        return
      }
      
      const { granted } = await checkPermission(config.handle)
      
      if (!granted) {
        setCards([])
        setShuffledCards([])
        setConfigStatus('need-permission')
        return
      }
      
      const files = await loadFlashcardFiles(config.handle)
      
      const allCards = []
      for (const file of files) {
        const parsed = parseFlashcards(file.content, file.path)
        allCards.push(...parsed)
      }
      
      setCards(allCards)
      setShuffledCards(shuffleCards(allCards))
      setConfigStatus('ready')
    } catch (err) {
      console.error('Failed to load flashcards:', err)
      setCards([])
      setShuffledCards([])
      setConfigStatus('error')
    } finally {
      setLoading(false)
    }
  }, [widgetId, shuffleCards])

  useEffect(() => {
    loadCards()
    
    const handleRefresh = (e) => {
      if (!e.detail?.widgetId || e.detail.widgetId === widgetId) {
        loadCards()
      }
    }
    window.addEventListener('flashcard-refresh', handleRefresh)
    return () => window.removeEventListener('flashcard-refresh', handleRefresh)
  }, [loadCards, widgetId])

  useEffect(() => {
    if (!widgetId) return
    const saved = localStorage.getItem(STORAGE_KEY_PREFIX + widgetId)
    if (saved) {
      try {
        const { index } = JSON.parse(saved)
        if (typeof index === 'number' && index >= 0) {
          setCurrentIndex(index)
        }
      } catch {}
    }
  }, [widgetId])

  useEffect(() => {
    if (!widgetId) return
    localStorage.setItem(STORAGE_KEY_PREFIX + widgetId, JSON.stringify({ index: currentIndex }))
  }, [currentIndex, widgetId])

  const currentCard = useMemo(() => {
    if (shuffledCards.length === 0) return null
    return shuffledCards[currentIndex] || shuffledCards[0]
  }, [shuffledCards, currentIndex])

  const goToNext = useCallback(() => {
    if (shuffledCards.length <= 1) return
    if (isFlipped) {
      setNoTransition(true)
      setIsFlipped(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoTransition(false)
        })
      })
    }
    setCurrentIndex(prev => (prev + 1) % shuffledCards.length)
  }, [shuffledCards.length, isFlipped])

  const goToPrev = useCallback(() => {
    if (shuffledCards.length <= 1) return
    if (isFlipped) {
      setNoTransition(true)
      setIsFlipped(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setNoTransition(false)
        })
      })
    }
    setCurrentIndex(prev => (prev - 1 + shuffledCards.length) % shuffledCards.length)
  }, [shuffledCards.length, isFlipped])

  const handleFlip = useCallback(() => {
    if (currentCard?.type === 'double') {
      setIsFlipped(prev => !prev)
    }
  }, [currentCard])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') {
      goToPrev()
    } else if (e.key === 'ArrowRight') {
      goToNext()
    } else if ((e.key === ' ' || e.key === 'Enter') && currentCard?.type === 'double') {
      e.preventDefault()
      handleFlip()
    }
  }, [goToPrev, goToNext, handleFlip, currentCard])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (onOpenSettings) {
      onOpenSettings()
    }
  }, [onOpenSettings])

  const handleReshuffle = useCallback(() => {
    setShuffledCards(shuffleCards(cards))
    setCurrentIndex(0)
    setIsFlipped(false)
  }, [cards, shuffleCards])

  const sizeClass = `flashcard-${size.replace('x', 'x')}`
  const isSmall = size === '1x1'

  if (loading) {
    return (
      <div className={`flashcard-widget ${sizeClass}`}>
        <div className="flashcard-loading">加载中...</div>
      </div>
    )
  }

  if (configStatus === 'no-config') {
    return (
      <div 
        className={`flashcard-widget ${sizeClass}`} 
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
        onClick={onOpenSettings}
      >
        <div className="flashcard-empty">
          <div>点击配置闪卡，右键打开设置</div>
        </div>
      </div>
    )
  }

  if (configStatus === 'need-permission') {
    return (
      <div 
        className={`flashcard-widget ${sizeClass}`}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
        onClick={onOpenSettings}
      >
        <div className="flashcard-empty">
          <div>数据源权限丢失，点击重新授权</div>
        </div>
      </div>
    )
  }

  if (configStatus === 'error') {
    return (
      <div 
        className={`flashcard-widget ${sizeClass}`}
        onContextMenu={handleContextMenu}
        style={{ cursor: 'pointer' }}
        onClick={onOpenSettings}
      >
        <div className="flashcard-empty">
          <div>配置加载失败，右键打开设置</div>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div 
        className={`flashcard-widget ${sizeClass}`}
        onContextMenu={handleContextMenu}
      >
        <div className="flashcard-empty">
          <div>暂无卡片，右键打开设置</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`flashcard-widget ${sizeClass}`} 
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
    >
      {!isSmall && (
        <div className="flashcard-header">
          <div className="flashcard-tags">
            {currentCard.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="flashcard-tag">{tag}</span>
            ))}
            {currentCard.tags.length > 3 && (
              <span className="flashcard-tag">+{currentCard.tags.length - 3}</span>
            )}
          </div>
          <div className="flashcard-counter">
            {currentIndex + 1} / {shuffledCards.length}
          </div>
        </div>
      )}

      <div 
        className={`flashcard-container ${isFlipped ? 'flipped' : ''} ${currentCard.type === 'single' ? 'no-flip' : ''} ${noTransition ? 'no-transition' : ''}`} 
        onClick={handleFlip}
      >
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <div className="flashcard-content">
              <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                {currentCard.type === 'double' ? currentCard.front : currentCard.content}
              </ReactMarkdown>
            </div>
          </div>
          {currentCard.type === 'double' && (
            <div className="flashcard-back">
              <div className="flashcard-content">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                  {currentCard.back}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flashcard-nav">
        <button 
          className="flashcard-nav-btn prev" 
          onClick={(e) => { e.stopPropagation(); goToPrev(); }}
          disabled={shuffledCards.length <= 1}
        >
          ‹
        </button>
        <div className="flashcard-nav-center">
          {!isSmall && currentCard.type === 'double' && !isFlipped && (
            <span className="flashcard-hint">点击翻转</span>
          )}
          {shuffledCards.length > 1 && (
            <button 
              className="flashcard-reshuffle-btn"
              onClick={(e) => { e.stopPropagation(); handleReshuffle(); }}
              title="重新洗牌"
            >
              🔀
            </button>
          )}
        </div>
        <button 
          className="flashcard-nav-btn next" 
          onClick={(e) => { e.stopPropagation(); goToNext(); }}
          disabled={shuffledCards.length <= 1}
        >
          ›
        </button>
      </div>
    </div>
  )
}
