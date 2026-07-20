import { useEffect, useState } from 'react'
import { contentUrl } from '../utils/assets'

const cache = new Map()
const inflight = new Map()

function fetchContent(path) {
  const url = contentUrl(path)
  if (cache.has(url)) return Promise.resolve(cache.get(url))
  if (inflight.has(url)) return inflight.get(url)

  const request = fetch(url, { cache: 'force-cache' })
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load ${path}`)
      return res.json()
    })
    .then((json) => {
      cache.set(url, json)
      return json
    })
    .finally(() => {
      inflight.delete(url)
    })

  inflight.set(url, request)
  return request
}

/** Warm the content cache so route changes do not flash a spinner. */
export function prefetchContent(paths) {
  paths.forEach((path) => {
    fetchContent(path).catch(() => {})
  })
}

export function useContent(path) {
  const url = contentUrl(path)
  const [data, setData] = useState(() => (cache.has(url) ? cache.get(url) : null))
  const [loading, setLoading] = useState(() => !cache.has(url))
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (cache.has(url)) {
        setData(cache.get(url))
        setLoading(false)
        setError(null)
        // Background refresh without blanking the UI
        fetch(`${url}?t=${Date.now()}`, { cache: 'no-store' })
          .then((res) => (res.ok ? res.json() : null))
          .then((json) => {
            if (!cancelled && json) {
              cache.set(url, json)
              setData(json)
            }
          })
          .catch(() => {})
        return
      }

      setLoading(true)
      setError(null)
      try {
        const json = await fetchContent(path)
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

  return { data, loading: loading && !data, error }
}

export function combineContentStates(...states) {
  return {
    loading: states.some((state) => state.loading),
    error: states.map((state) => state.error).find(Boolean) ?? null,
  }
}

export function clearContentCache() {
  cache.clear()
  inflight.clear()
}
