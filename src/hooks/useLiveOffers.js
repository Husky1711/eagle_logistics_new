import { useEffect, useState } from 'react'

/**
 * Live offers from the PHP API (public/api/offers.php).
 * status: 'loading' | 'ready' | 'unavailable'
 * 'unavailable' (no PHP, network error) lets pages fall back to their built-in content.
 */
let cache = null
let inflight = null

function fetchOffers() {
  if (cache) return Promise.resolve(cache)
  if (!inflight) {
    inflight = fetch('/api/offers.php', { headers: { Accept: 'application/json' } })
      .then((res) => {
        if (!res.ok || !(res.headers.get('content-type') || '').includes('application/json')) {
          throw new Error('Offers API unavailable')
        }
        return res.json()
      })
      .then((json) => {
        if (!json?.ok || !Array.isArray(json.offers)) throw new Error('Bad offers response')
        cache = { offers: json.offers, settings: json.settings || {} }
        return cache
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function useLiveOffers() {
  const [state, setState] = useState(() =>
    cache ? { status: 'ready', ...cache } : { status: 'loading', offers: [], settings: {} },
  )

  useEffect(() => {
    if (cache) return undefined
    let cancelled = false
    fetchOffers()
      .then((data) => !cancelled && setState({ status: 'ready', ...data }))
      .catch(() => !cancelled && setState({ status: 'unavailable', offers: [], settings: {} }))
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
