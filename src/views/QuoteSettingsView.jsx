import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { sendMessage } from '../messaging'
import defaultQuotes from '../../quotes.json'

const QKEY = 'quotesDataset'

export default function QuoteSettingsView({ onClose }) {
  const [quotes, setQuotes] = useState([])
  const [newText, setNewText] = useState('')
  const [newAuthor, setNewAuthor] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 10

  const loadQuotes = useCallback(async () => {
    try {
      const resp = await sendMessage('storageGet', { key: QKEY })
      let ds = resp?.value
      if (!ds || !Array.isArray(ds) || ds.length === 0) {
        ds = Array.isArray(defaultQuotes) ? defaultQuotes : []
        await sendMessage('storageSet', { key: QKEY, value: ds })
      }
      setQuotes(ds)
    } catch {
      const ds = Array.isArray(defaultQuotes) ? defaultQuotes : []
      setQuotes(ds)
    }
  }, [])

  useEffect(() => {
    loadQuotes()
  }, [loadQuotes])

  const filteredQuotes = useMemo(() => {
    const q = (search || '').trim().toLowerCase()
    if (!q) return quotes
    return quotes.filter(it =>
      (it.t || '').toLowerCase().includes(q) ||
      (it.a || '').toLowerCase().includes(q)
    )
  }, [quotes, search])

  const totalPages = Math.ceil(filteredQuotes.length / pageSize)
  const paginatedQuotes = useMemo(() => {
    const start = page * pageSize
    return filteredQuotes.slice(start, start + pageSize)
  }, [filteredQuotes, page])

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) {
      setPage(totalPages - 1)
    }
  }, [totalPages, page])

  const handleAdd = useCallback(async () => {
    const t = (newText || '').trim()
    const a = (newAuthor || '').trim()
    if (!t) return

    const newQuotes = [{ t, a }, ...quotes]
    setQuotes(newQuotes)
    setNewText('')
    setNewAuthor('')
    setPage(0)

    try {
      await sendMessage('storageSet', { key: QKEY, value: newQuotes })
    } catch (error) {
      console.error('保存失败:', error)
    }
  }, [newText, newAuthor, quotes])

  const handleDelete = useCallback(async (index) => {
    const actualIndex = page * pageSize + index
    const newQuotes = quotes.filter((_, i) => i !== actualIndex)
    setQuotes(newQuotes)

    try {
      await sendMessage('storageSet', { key: QKEY, value: newQuotes })
    } catch (error) {
      console.error('删除失败:', error)
    }
  }, [quotes, page, pageSize])

  const handlePrevPage = useCallback(() => {
    setPage(p => Math.max(0, p - 1))
  }, [])

  const handleNextPage = useCallback(() => {
    setPage(p => Math.min(totalPages - 1, p + 1))
  }, [totalPages])

  return (
    <div className="quote-settings-view">
      <div className="quote-settings-header">
        <div className="quote-settings-title">名言警句配置</div>
        <div className="quote-settings-actions">
          <button className="btn" onClick={onClose}>关闭</button>
        </div>
      </div>
      <div className="quote-settings-main">
        <div className="quote-settings-section">
          <div className="quote-settings-row">
            <input
              className="quote-settings-input"
              placeholder="输入新的格言文本"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
            />
            <input
              className="quote-settings-input"
              placeholder="作者（可选）"
              value={newAuthor}
              onChange={(e) => setNewAuthor(e.target.value)}
            />
            <button className="btn primary" onClick={handleAdd}>添加到数据集</button>
            <div className="quote-settings-small">当前数据集用于组件随机展示，可随时增删</div>
          </div>
        </div>
        <div className="quote-settings-sep"></div>
        <div className="quote-settings-section">
          <input
            className="quote-settings-input"
            placeholder="搜索格言或作者"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
        <div className="quote-settings-sep"></div>
        <div className="quote-settings-section">
          <div className="quote-settings-list">
            {paginatedQuotes.length === 0 ? (
              <div className="quote-settings-small">暂无数据</div>
            ) : (
              paginatedQuotes.map((it, index) => (
                <div
                  key={`${it.t}-${index}`}
                  className="quote-settings-item"
                  onMouseEnter={(e) => e.currentTarget.classList.add('mark')}
                  onMouseLeave={(e) => e.currentTarget.classList.remove('mark')}
                >
                  <div className="quote-settings-item-text">{it.t || ''}</div>
                  <div className="quote-settings-item-author">{it.a || ''}</div>
                  <button
                    className="quote-settings-item-del"
                    onClick={() => handleDelete(index)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="quote-settings-pager">
              <button
                className="btn"
                onClick={handlePrevPage}
                disabled={page === 0}
              >
                上一页
              </button>
              <span className="quote-settings-small">
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn"
                onClick={handleNextPage}
                disabled={page >= totalPages - 1}
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
