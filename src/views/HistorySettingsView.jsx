import React, { useState, useEffect } from 'react'
import { sendMessage } from '../messaging'

const STORAGE_KEY = 'historySettings'

export default function HistorySettingsView({ onClose, onBack }) {
  const [enabled, setEnabled] = useState(false)
  const [rules, setRules] = useState('')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const resp = await sendMessage('storageGet', { key: STORAGE_KEY })
      const settings = resp?.value || { enabled: false, rules: '' }
      setEnabled(settings.enabled || false)
      setRules(settings.rules || '')
    } catch {
      setEnabled(false)
      setRules('')
    }
  }

  const handleSave = async () => {
    try {
      await sendMessage('storageSet', {
        key: STORAGE_KEY,
        value: { enabled, rules }
      })
      if (onBack) {
        onBack()
      }
    } catch (error) {
      console.error('保存设置失败:', error)
    }
  }

  return (
    <div className="history-settings-view">
      <div className="history-settings-header">
        <div className="history-settings-title">历史记录配置</div>
        <div className="history-settings-actions">
          <button className="btn primary" onClick={handleSave}>
            保存并返回
          </button>
        </div>
      </div>
      <div className="history-settings-content">
        <div className="history-settings-row">
          <div className="history-settings-label">是否开启黑名单</div>
          <label className="history-settings-switch">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span>开启后，满足任一屏蔽条件的记录将被隐藏</span>
          </label>
        </div>
        <div className="history-settings-row">
          <div className="history-settings-label">黑名单（每行一个关键词或域名片段）</div>
          <textarea
            className="history-settings-textarea"
            placeholder="例如：&#10;example.com&#10;视频&#10;某些关键词"
            value={rules}
            onChange={(e) => setRules(e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
