import { useEffect, useState } from 'react'
import { contentUrl } from '../utils/assets'

const cache = new Map()

export function useContent(path) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const url = contentUrl(path)

    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (cache.has(url)) {
          if (!cancelled) setData(cache.get(url))
          return
        }
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
  }, [path])

  return { data, loading, error }
}

export function clearContentCache() {
  cache.clear()
}
