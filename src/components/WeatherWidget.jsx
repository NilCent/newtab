import React, { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'weatherData'
const CACHE_DURATION = 30 * 60 * 1000

const weatherCodes = {
  0: { icon: '☀️', desc: '晴朗' },
  1: { icon: '🌤️', desc: '多云' },
  2: { icon: '⛅', desc: '多云' },
  3: { icon: '☁️', desc: '阴天' },
  45: { icon: '🌫️', desc: '雾' },
  48: { icon: '🌫️', desc: '雾凇' },
  51: { icon: '🌦️', desc: '毛毛雨' },
  53: { icon: '🌦️', desc: '小雨' },
  55: { icon: '🌧️', desc: '中雨' },
  61: { icon: '🌧️', desc: '小雨' },
  63: { icon: '🌧️', desc: '中雨' },
  65: { icon: '🌧️', desc: '大雨' },
  71: { icon: '🌨️', desc: '小雪' },
  73: { icon: '🌨️', desc: '中雪' },
  75: { icon: '❄️', desc: '大雪' },
  80: { icon: '🌦️', desc: '阵雨' },
  81: { icon: '🌧️', desc: '强阵雨' },
  82: { icon: '⛈️', desc: '暴雨' },
  95: { icon: '⛈️', desc: '雷雨' },
  96: { icon: '⛈️', desc: '雷雨伴冰雹' },
  99: { icon: '⛈️', desc: '强雷雨伴冰雹' },
}

function getWeatherInfo(code) {
  return weatherCodes[code] || { icon: '❓', desc: '未知' }
}

function getWindLevel(speed) {
  if (speed === undefined || speed === null) return '-'
  if (speed < 1) return '0级'
  if (speed < 6) return '1级'
  if (speed < 12) return '2级'
  if (speed < 20) return '3级'
  if (speed < 29) return '4级'
  if (speed < 39) return '5级'
  if (speed < 50) return '6级'
  if (speed < 62) return '7级'
  if (speed < 75) return '8级'
  return '9级+'
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchWeather = useCallback(async () => {
    setLoading(true)
    try {
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=39.9042&longitude=116.4074&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto&forecast_days=7'
      const response = await fetch(url)
      if (!response.ok) throw new Error('获取天气失败')
      const data = await response.json()
      
      const weatherData = {
        daily: data.daily.time.map((time, index) => ({
          date: time,
          maxTemp: Math.round(data.daily.temperature_2m_max[index]),
          minTemp: Math.round(data.daily.temperature_2m_min[index]),
          weatherCode: data.daily.weather_code[index],
          windSpeed: Math.round(data.daily.wind_speed_10m_max[index]),
        })),
        updatedAt: Date.now(),
      }
      
      setWeather(weatherData)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(weatherData))
    } catch (err) {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached) {
        setWeather(JSON.parse(cached))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached)
      setWeather(parsed)
      if (Date.now() - (parsed.updatedAt || 0) > CACHE_DURATION) {
        fetchWeather()
      }
    } else {
      fetchWeather()
    }
  }, [fetchWeather])

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    const today = new Date()
    if (date.toDateString() === today.toDateString()) return '今天'
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return weekdays[date.getDay()]
  }

  return (
    <div className="widget-inner weather-widget">
      <div className="weather-header">
        <span className="weather-title">北京</span>
        <button 
          className="weather-refresh-btn" 
          onClick={fetchWeather}
          disabled={loading}
        >
          {loading ? '⟳' : '↻'}
        </button>
      </div>
      <div className="weather-list">
        {weather?.daily?.map((day, index) => (
          <div key={index} className="weather-item">
            <span className="weather-date">{formatDate(day.date)}</span>
            <span className="weather-icon" title={getWeatherInfo(day.weatherCode).desc}>{getWeatherInfo(day.weatherCode).icon}</span>
            <span className="weather-temp">{day.maxTemp}°/{day.minTemp}°</span>
            <span className="weather-wind">{getWindLevel(day.windSpeed)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
