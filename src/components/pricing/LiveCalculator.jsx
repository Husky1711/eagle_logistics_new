import { useEffect, useMemo, useState } from 'react'
import { Box, ChevronDown, Clock, Loader2, MapPin, MessageCircle, Package, Scale, Zap } from 'lucide-react'
import Card from '../common/Card'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
const kgFmt = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`
const firstDay = (transit) => {
  const m = /(\d+)/.exec(transit || '')
  return m ? Number(m[1]) : Infinity
}

let configCache = null

/**
 * Destinations + display settings from /api/quote.php.
 * status 'unavailable' means no PHP (e.g. static hosting) -> page keeps the old calculator.
 */
export function useQuoteConfig() {
  const [state, setState] = useState(() => (configCache ? { status: 'ready', ...configCache } : { status: 'loading' }))
  useEffect(() => {
    if (configCache) return undefined
    let cancelled = false
    fetch('/api/quote.php', { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok && (r.headers.get('content-type') || '').includes('application/json') ? r.json() : Promise.reject()))
      .then((j) => {
        if (!j?.ok || !Array.isArray(j.destinations) || !j.destinations.length) throw new Error('bad config')
        configCache = { destinations: j.destinations, settings: j.settings || {} }
        if (!cancelled) setState({ status: 'ready', ...configCache })
      })
      .catch(() => !cancelled && setState({ status: 'unavailable' }))
    return () => {
      cancelled = true
    }
  }, [])
  return state
}

/** Price calculator backed by the server: customers only ever see final prices. */
export default function LiveCalculator({ config, content = {}, whatsapp, offerCode, offerReminder }) {
  const zones = useMemo(() => {
    const map = new Map()
    for (const d of config.destinations) {
      if (!map.has(d.zone)) map.set(d.zone, [])
      map.get(d.zone).push(d.name)
    }
    return [...map.entries()]
  }, [config.destinations])

  const [form, setForm] = useState(() => ({
    destination: config.destinations.find((d) => d.name === 'United States')?.name || config.destinations[0].name,
    weight: '',
    length: '',
    width: '',
    height: '',
  }))
  const [showBox, setShowBox] = useState(false)
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const gstNote = config.settings.pricesIncludeGst ? `incl. ${config.settings.gstPercent}% GST` : `+ ${config.settings.gstPercent}% GST`

  async function submit(e) {
    e.preventDefault()
    setError('')
    const weight = Number(form.weight)
    if (!(weight > 0)) return setError('Enter the parcel weight in kg')
    const dims = showBox ? [form.length, form.width, form.height] : []
    if (showBox && dims.some((v) => v !== '') && !dims.every((v) => Number(v) > 0)) {
      return setError('Enter all three box sizes in cm, or remove the box size')
    }
    setBusy(true)
    try {
      const res = await fetch('/api/quote.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          destination: form.destination,
          weight,
          ...(showBox ? { length: Number(form.length) || 0, width: Number(form.width) || 0, height: Number(form.height) || 0 } : {}),
        }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok || !json?.ok) throw new Error(json?.error || 'Could not get prices right now')
      setQuote({ ...json, destination: form.destination })
    } catch (err) {
      setError(err.message)
      setQuote(null)
    } finally {
      setBusy(false)
    }
  }

  const results = quote?.results || []
  const fastest = results.length > 1 ? results.reduce((a, b) => (firstDay(b.transit) < firstDay(a.transit) ? b : a)) : null
  const showFastest = fastest && firstDay(fastest.transit) < firstDay(results[0].transit)
  const w = quote?.weights
  const sizeCharged = w && w.volumetric > w.actual

  const genericWa = buildWhatsAppUrl(
    whatsapp,
    `Hi Eagle Logistics, I need a shipping quote: ${form.weight || '?'} kg to ${form.destination}.${offerCode ? ` I'd like to use code ${offerCode}.` : ''}`,
  )

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <Card className="lg:sticky lg:top-28">
        <h2 className="mb-6 font-display text-xl font-semibold text-heading">Parcel details</h2>
        <form onSubmit={submit} noValidate className="space-y-5">
          <div>
            <label htmlFor="calc-destination" className="mb-1.5 block text-sm font-medium text-ink">
              Sending to
            </label>
            <div className="relative">
              <MapPin size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" aria-hidden />
              <select
                id="calc-destination"
                value={form.destination}
                onChange={set('destination')}
                className="w-full appearance-none rounded-lg border border-neutral-300 bg-white py-3 pl-11 pr-10 text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              >
                {zones.map(([zone, names]) => (
                  <optgroup key={zone} label={zone}>
                    {names.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <ChevronDown size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden />
            </div>
          </div>

          <div>
            <label htmlFor="calc-weight" className="mb-1.5 block text-sm font-medium text-ink">
              Weight (kg)<span className="ml-0.5 text-[#FC012E]" aria-hidden>*</span>
            </label>
            <div className="relative">
              <Scale size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-primary-500" aria-hidden />
              <input
                id="calc-weight"
                type="number"
                inputMode="decimal"
                min="0.1"
                step="0.1"
                value={form.weight}
                onChange={set('weight')}
                placeholder="e.g. 2.5"
                className="w-full rounded-lg border border-neutral-300 py-3 pl-11 pr-4 text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {!showBox ? (
            <button type="button" onClick={() => setShowBox(true)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
              <Box size={16} aria-hidden /> Add box size for an exact price (optional)
            </button>
          ) : (
            <fieldset className="rounded-xl border border-primary-100 bg-primary-50/50 p-4">
              <legend className="px-1 text-sm font-medium text-ink">Box size (cm)</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['length', 'Length'],
                  ['width', 'Width'],
                  ['height', 'Height'],
                ].map(([k, label]) => (
                  <label key={k} className="block">
                    <span className="mb-1 block text-xs text-ink-soft">{label}</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="1"
                      value={form[k]}
                      onChange={set(k)}
                      className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                    />
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-soft">Couriers charge by weight or box size — whichever is more.</p>
              <button
                type="button"
                onClick={() => {
                  setShowBox(false)
                  setForm((f) => ({ ...f, length: '', width: '', height: '' }))
                }}
                className="mt-2 text-xs font-medium text-ink-soft underline"
              >
                Remove box size
              </button>
            </fieldset>
          )}

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            {busy ? <Loader2 size={18} className="mr-2 animate-spin" aria-hidden /> : null}
            {busy ? 'Checking prices…' : content.calculateButton || 'Compare prices'}
          </button>
        </form>
        <p className="mt-4 text-xs text-neutral-500">
          Prices are {gstNote}. Final price is confirmed when we collect your parcel.
        </p>
      </Card>

      <div aria-live="polite">
        {!quote && (
          <Card className="flex min-h-[300px] flex-col items-center justify-center text-center">
            <Package size={40} className="text-primary-300" aria-hidden />
            <p className="mt-3 max-w-xs text-ink">Choose where you’re sending and the weight to compare DHL, FedEx and UPS prices.</p>
          </Card>
        )}

        {quote?.tooHeavy && (
          <Card className="text-center">
            <h2 className="font-display text-lg font-semibold text-heading">Heavier than {kgFmt(quote.maxWeight)}?</h2>
            <p className="mt-2 text-ink">That’s cargo territory — message us and we’ll send you the best freight rate.</p>
            {genericWa && (
              <a href={genericWa} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex">
                <MessageCircle size={18} className="mr-2" aria-hidden /> Get a cargo quote
              </a>
            )}
          </Card>
        )}

        {quote && !quote.tooHeavy && results.length === 0 && (
          <Card className="text-center">
            <h2 className="font-display text-lg font-semibold">{content.noMatchTitle || 'No online price for this one'}</h2>
            <p className="mt-2 text-ink">{content.noMatchMessage || 'WhatsApp us and we’ll quote it for you.'}</p>
            {genericWa && (
              <a href={genericWa} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4 inline-flex">
                <MessageCircle size={18} className="mr-2" aria-hidden /> {content.whatsappCta || 'Get Quote on WhatsApp'}
              </a>
            )}
          </Card>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 className="font-display text-xl font-semibold text-heading">
                {results.length} option{results.length > 1 ? 's' : ''} to {quote.destination}
              </h2>
              <p className="text-sm text-ink-soft">
                Charged as <strong className="text-heading">{kgFmt(w.chargeable)}</strong>
                {sizeCharged && ' (by box size)'}
              </p>
            </div>
            {sizeCharged && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
                Your box is large for its weight, so couriers charge it as {kgFmt(w.volumetric)} (L×W×H ÷ {config.settings.volumetricDivisor}). A
                smaller box could cost less.
              </p>
            )}

            {results.map((r, i) => {
              const cheapest = i === 0
              const isFastest = showFastest && r.courierId === fastest.courierId
              const wa = buildWhatsAppUrl(
                whatsapp,
                `Hi Eagle Logistics, I'd like to book ${r.courier}: ${kgFmt(w.chargeable)} to ${quote.destination}, quoted ₹${inr.format(r.price)} (${gstNote}).${
                  offerCode ? ` Code ${offerCode}.` : ''
                }`,
              )
              return (
                <article
                  key={r.courierId}
                  className={`rounded-2xl border bg-white p-5 shadow-soft transition sm:p-6 ${
                    cheapest ? 'border-primary-400 ring-1 ring-primary-300' : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                      <CourierLogo id={r.courierId} name={r.courier} />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="font-display text-lg font-semibold text-heading">{r.courier}</h3>
                          {cheapest && <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">Best price</span>}
                          {isFastest && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                              <Zap size={12} aria-hidden /> Fastest
                            </span>
                          )}
                        </div>
                        {r.transit && (
                          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-ink-soft">
                            <Clock size={14} aria-hidden /> {r.transit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-2xl font-bold text-primary-600 sm:text-3xl">₹{inr.format(r.price)}</p>
                      <p className="text-xs text-ink-soft">{gstNote}</p>
                    </div>
                  </div>
                  {wa && (
                    <a
                      href={wa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                        cheapest ? 'bg-primary-600 text-white hover:bg-primary-700' : 'border border-primary-300 text-primary-600 hover:bg-primary-50'
                      }`}
                    >
                      <MessageCircle size={16} className="mr-2" aria-hidden /> Book {r.courier} on WhatsApp
                    </a>
                  )}
                </article>
              )
            })}
            {offerReminder && <p className="text-sm text-primary-700">{offerReminder}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

function CourierLogo({ id, name }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <span className="flex h-10 w-14 shrink-0 items-center sm:h-12 sm:w-[72px] justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
        {name.slice(0, 6)}
      </span>
    )
  }
  return (
    <img
      src={`/assets/couriers/${id}.png`}
      alt={`${name} logo`}
      onError={() => setFailed(true)}
      className="h-10 w-14 shrink-0 rounded-lg border border-neutral-100 object-contain sm:h-12 sm:w-[72px]"
    />
  )
}
