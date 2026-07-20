import { createContext, useContext, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS } from '../config/settingsDefaults'
import { contentUrl } from '../utils/assets'

const SettingsContext = createContext({
  settings: DEFAULT_SETTINGS,
  loading: false,
  error: null,
})

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetch(contentUrl('settings.json'))
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load settings')
        return res.json()
      })
      .then((json) => {
        if (!cancelled) setSettings(json)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <SettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const { settings, loading, error } = useContext(SettingsContext)
  return {
    settings: settings ?? DEFAULT_SETTINGS,
    loading,
    error,
  }
}
