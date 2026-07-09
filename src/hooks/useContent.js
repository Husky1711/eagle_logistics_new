import { useEffect, useState } from 'react'
import { contentUrl } from '../utils/assets'

const cache = new Map()

export function useContent(path) {
  const url = contentUrl(path)
  const cached = cache.has(url)
  const [data, setData] = useState(cached ? cache.get(url) : null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (cache.has(url)) {
        if (!cancelled) {
          setData(cache.get(url))
          setLoading(false)
          setError(null)
        }
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Failed to load ${path}`)
        const json = await res.json()
        cache.set(url, json)
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load content')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [path, url])

  return { data, loading, error }
}

export function combineContentStates(...states) {
  return {
    loading: states.some((state) => state.loading),
    error: states.map((state) => state.error).find(Boolean) ?? null,
  }
}

export function clearContentCache() {
  cache.clear()
}
