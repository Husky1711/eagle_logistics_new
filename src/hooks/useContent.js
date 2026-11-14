import { useEffect, useState } from 'react'
import { contentUrl } from '../utils/assets'

// Pre-rendered pages embed the content they were built with (scripts/prerender.mjs),
// so the first client render matches the static HTML instead of showing a spinner.
const cache = new Map(
  typeof window !== 'undefined' && window.__PRERENDER_CONTENT__
    ? Object.entries(window.__PRERENDER_CONTENT__)
    : [],
)
const inflight = new Map()

function fetchContent(path, { bust = false } = {}) {
  const url = contentUrl(path)
  const requestUrl = bust ? `${url}?t=${Date.now()}` : url

  // Always revalidate in-flight by URL key (without query)
  if (!bust && cache.has(url)) return Promise.resolve(cache.get(url))
  if (!bust && inflight.has(url)) return inflight.get(url)

  const request = fetch(requestUrl, { cache: 'no-store' })
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

  if (!bust) inflight.set(url, request)
  return request
}

/** Warm the content cache so route changes do not flash a spinner. */
export function prefetchContent(paths) {
  paths.forEach((path) => {
    fetchContent(path, { bust: true }).catch(() => {})
  })
}

export function useContent(path) {
  const url = contentUrl(path)
  // Lets scripts/prerender.mjs embed only the content a page actually renders
  if (typeof window !== 'undefined') (window.__CONTENT_USED__ ||= new Set()).add(url)
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
      } else {
        setLoading(true)
        setError(null)
      }

      try {
        // Always bust HTTP cache so content edits show up
        const json = await fetchContent(path, { bust: true })
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch (err) {
        if (!cancelled && !cache.has(url)) {
          setError(err.message || 'Failed to load content')
        }
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

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    clearContentCache()
  })
  import.meta.hot.dispose(() => {
    clearContentCache()
  })
}
