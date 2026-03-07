import React, { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'hackerNewsData'
const CACHE_DURATION = 10 * 60 * 1000

export default function HackerNewsWidget() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchStories = useCallback(async () => {
    setLoading(true)
    try {
      const topStoriesUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json'
      const response = await fetch(topStoriesUrl)
      if (!response.ok) throw new Error('获取故事列表失败')
      const storyIds = await response.json()
      
      const top30Ids = storyIds.slice(0, 30)
      const storyPromises = top30Ids.map(id => 
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(res => res.json())
      )
      const storiesData = await Promise.all(storyPromises)
      
      const validStories = storiesData.filter(story => story && story.title)
      setStories(validStories)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        stories: validStories,
        updatedAt: Date.now()
      }))
    } catch (err) {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        setStories(parsed.stories || [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      setStories(parsed.stories || [])
      if (Date.now() - (parsed.updatedAt || 0) > CACHE_DURATION) {
        fetchStories()
      } else {
        setLoading(false)
      }
    } else {
      fetchStories()
    }
  }, [fetchStories])

  const handleWheel = (e) => {
    e.stopPropagation()
  }

  return (
    <div className="widget-inner hacker-news-widget">
      <div className="hn-header">
        <span className="hn-title">Hacker News</span>
        <button className="hn-refresh-btn" onClick={fetchStories} disabled={loading}>
          {loading ? '⟳' : '↻'}
        </button>
      </div>
      <div className="hn-list" onWheel={handleWheel}>
        {loading && stories.length === 0 ? (
          <div className="hn-loading">加载中...</div>
        ) : (
          stories.map((story, index) => (
            <div key={story.id} className="hn-item">
              <div className="hn-rank">{index + 1}</div>
              <div className="hn-content">
                <a href={story.url || `https://news.ycombinator.com/item?id=${story.id}`} 
                   className="hn-title" 
                   target="_blank" 
                   rel="noopener noreferrer">
                  {story.title}
                </a>
                <div className="hn-meta">
                  <span className="hn-points">{story.score} points</span>
                  <span className="hn-comments">
                    <a href={`https://news.ycombinator.com/item?id=${story.id}`} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="hn-comments-link">
                      {story.descendants || 0} comments
                    </a>
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
