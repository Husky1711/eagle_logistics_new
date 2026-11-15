import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calculator, Globe2, Grid3x3, Settings2, Truck } from 'lucide-react'
import { api } from '../api'
import QuoteTester from './QuoteTester'
import CouriersPanel from './CouriersPanel'
import RateCardsPanel from './RateCardsPanel'
import ZonesPanel from './ZonesPanel'
import SettingsPanel from './SettingsPanel'

const SECTIONS = [
  { id: 'tester', label: 'Quote tester', icon: Calculator, help: 'Try any parcel and see cost, commission and profit for every courier.' },
  { id: 'couriers', label: 'Couriers & margins', icon: Truck, help: 'Your discount, fuel surcharge and commission for each courier.' },
  { id: 'rates', label: 'Rate cards', icon: Grid3x3, help: 'Published courier rates by weight slab and zone (from the courier’s rate card).' },
  { id: 'zones', label: 'Zones & countries', icon: Globe2, help: 'Which destinations belong to which zone.' },
  { id: 'settings', label: 'GST & rules', icon: Settings2, help: 'GST, rounding, minimum charge and weight rules.' },
]

/** Admin → Pricing. Edits a draft locally; nothing changes on the website until "Save". */
export default function PricingManager({ onAuthLost }) {
  const [saved, setSaved] = useState(null)
  const [draft, setDraft] = useState(null)
  const [section, setSection] = useState('tester')
  const [status, setStatus] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) onAuthLost()
      else setStatus({ type: 'error', text: err.message })
    },
    [onAuthLost],
  )

  useEffect(() => {
    api
      .pricing()
      .then((d) => {
        setSaved(d.pricing)
        setDraft(structuredClone(d.pricing))
      })
      .catch(handleError)
  }, [handleError])

  const dirty = useMemo(() => saved && draft && JSON.stringify(saved) !== JSON.stringify(draft), [saved, draft])

  useEffect(() => {
    if (!dirty) return undefined
    const warn = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  /** Immutable update helper: update((d) => { d.settings.gstPercent = 18 }) */
  const update = useCallback((fn) => {
    setDraft((d) => {
      const next = structuredClone(d)
      fn(next)
      return next
    })
  }, [])

  async function save() {
    setBusy(true)
    setStatus({ type: '', text: '' })
    try {
      const res = await api.savePricing(draft)
      setSaved(res.pricing)
      setDraft(structuredClone(res.pricing))
      setStatus({ type: 'ok', text: 'Prices saved — the website calculator uses them now.' })
    } catch (err) {
      handleError(err)
    } finally {
      setBusy(false)
    }
  }

  async function resetDemo() {
    try {
      const res = await api.resetPricing()
      setSaved(res.pricing)
      setDraft(structuredClone(res.pricing))
      setStatus({ type: 'ok', text: 'Demo pricing restored.' })
    } catch (err) {
      handleError(err)
    }
  }

  if (!draft) return <p className="text-ink">{status.text || 'Loading pricing…'}</p>

  const current = SECTIONS.find((s) => s.id === section)

  return (
    <div className="pb-24">
      <div>
        <h1 className="font-display text-2xl font-bold text-heading">Pricing</h1>
        <p className="mt-1 text-sm text-ink">
          Customers only ever see the final price. Courier costs, discounts and your commission stay private on the server.
        </p>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Pricing sections">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setSection(id)}
            aria-current={section === id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              section === id
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'bg-white text-ink ring-1 ring-neutral-200 hover:ring-primary-300'
            }`}
          >
            <Icon size={16} aria-hidden />
            {label}
          </button>
        ))}
      </nav>
      <p className="mt-3 text-sm text-ink-soft">{current.help}</p>

      <div className="mt-5">
        {section === 'tester' && <QuoteTester draft={draft} dirty={dirty} onError={handleError} />}
        {section === 'couriers' && <CouriersPanel draft={draft} update={update} />}
        {section === 'rates' && <RateCardsPanel draft={draft} update={update} />}
        {section === 'zones' && <ZonesPanel draft={draft} update={update} />}
        {section === 'settings' && <SettingsPanel draft={draft} update={update} onResetDemo={resetDemo} />}
      </div>

      {(dirty || status.text) && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <p
              role={status.type === 'error' ? 'alert' : 'status'}
              className={`text-sm font-medium ${
                status.type === 'error' ? 'text-red-700' : dirty ? 'text-amber-700' : 'text-green-700'
              }`}
            >
              {status.type === 'error' ? status.text : dirty ? '● Unsaved changes — the website still uses the saved prices.' : status.text}
            </p>
            {dirty && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(structuredClone(saved))
                    setStatus({ type: '', text: '' })
                  }}
                  className="btn-outline"
                >
                  Discard
                </button>
                <button type="button" onClick={save} disabled={busy} className="btn-primary">
                  {busy ? 'Saving…' : 'Save prices'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
