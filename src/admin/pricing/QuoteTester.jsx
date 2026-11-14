import { useEffect, useState } from 'react'
import { Info, Package } from 'lucide-react'
import { api } from '../api'
import { kg, money, money0 } from './format'

/** Try a parcel against the CURRENT DRAFT (unsaved edits included) and see the full breakdown. */
export default function QuoteTester({ draft, dirty, onError }) {
  const destinations = draft.zones.flatMap((z) => z.destinations.map((d) => ({ name: d, zone: z.name })))
  const [form, setForm] = useState({
    destination: destinations.find((d) => d.name === 'United States')?.name || destinations[0]?.name || '',
    weight: '8',
    length: '',
    width: '',
    height: '',
  })
  const [quote, setQuote] = useState(null)
  const [error, setError] = useState('')

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  // Re-run automatically as the admin types or edits rates (debounced)
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!form.destination || !(Number(form.weight) > 0)) {
        setQuote(null)
        return
      }
      api
        .previewPricing({ pricing: draft, ...form })
        .then((q) => {
          setQuote(q)
          setError('')
        })
        .catch((err) => {
          if (err.status === 401) onError(err)
          else setError(err.message)
        })
    }, 350)
    return () => window.clearTimeout(t)
  }, [form, draft, onError])

  const s = draft.settings
  const w = quote?.weights

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <Field label="Destination">
            <select value={form.destination} onChange={set('destination')} className={inputCls}>
              {draft.zones.map((z) => (
                <optgroup key={z.id} label={z.name}>
                  {z.destinations.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Weight (kg)">
            <input type="number" min="0.1" step="0.1" value={form.weight} onChange={set('weight')} className={inputCls} />
          </Field>
          <Field label="Length (cm)">
            <input type="number" min="0" value={form.length} onChange={set('length')} placeholder="optional" className={inputCls} />
          </Field>
          <Field label="Width (cm)">
            <input type="number" min="0" value={form.width} onChange={set('width')} placeholder="optional" className={inputCls} />
          </Field>
          <Field label="Height (cm)">
            <input type="number" min="0" value={form.height} onChange={set('height')} placeholder="optional" className={inputCls} />
          </Field>
        </div>
        {w && (
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink">
            <span className="inline-flex items-center gap-1.5 font-semibold text-heading">
              <Package size={16} aria-hidden /> Zone: {quote.zone}
            </span>
            <span>Actual {kg(w.actual)}</span>
            {w.volumetric > 0 && <span>Volumetric {kg(w.volumetric)} (L×W×H ÷ {s.volumetricDivisor})</span>}
            <span className="rounded-full bg-primary-50 px-2.5 py-0.5 font-semibold text-primary-700">Charged as {kg(w.chargeable)}</span>
          </p>
        )}
        {dirty && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-amber-700">
            <Info size={14} aria-hidden /> Using your unsaved changes — save to put them on the website.
          </p>
        )}
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {quote?.tooHeavy && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Over the {s.maxWeight} kg limit — the website asks customers to WhatsApp for a custom quote.
        </p>
      )}
      {quote && !quote.tooHeavy && quote.results.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No active courier has a rate for this weight and zone. Fill in the rate card (or “per kg above”).
        </p>
      )}

      {quote?.results?.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-soft">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Courier</th>
                <th className="px-3 py-3 text-right">Published rate</th>
                <th className="px-3 py-3 text-right">− Discount</th>
                <th className="px-3 py-3 text-right">+ Fuel</th>
                <th className="bg-neutral-100 px-3 py-3 text-right">= Your cost</th>
                <th className="px-3 py-3 text-right">+ Commission</th>
                <th className="px-3 py-3 text-right">Selling price</th>
                <th className="px-3 py-3 text-right">+ GST {s.gstPercent}%</th>
                <th className="bg-primary-50 px-3 py-3 text-right text-primary-700">Customer pays</th>
                <th className="bg-green-50 px-4 py-3 text-right text-green-800">Your profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {quote.results.map((r, i) => (
                <tr key={r.courierId} className={i === 0 ? 'bg-green-50/30' : ''}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-heading">
                      {r.courier}
                      {i === 0 && <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">Cheapest</span>}
                    </p>
                    <p className="text-xs text-ink-soft">
                      {r.transit || 'No transit time'} · {r.extraKg > 0 ? `${kg(r.slab)} slab + ${r.extraKg} kg` : `${kg(r.slab)} slab`}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-right">{money(r.published)}</td>
                  <td className="px-3 py-3 text-right text-red-700">−{money(r.discount)}</td>
                  <td className="px-3 py-3 text-right">+{money(r.fuel)}</td>
                  <td className="bg-neutral-50 px-3 py-3 text-right font-semibold">{money(r.cost)}</td>
                  <td className="px-3 py-3 text-right">+{money(r.commission)}</td>
                  <td className="px-3 py-3 text-right">
                    {money(r.selling)}
                    {r.minimumApplied && <span className="block text-[11px] text-amber-700">minimum charge</span>}
                  </td>
                  <td className="px-3 py-3 text-right">+{money(r.gst)}</td>
                  <td className="bg-primary-50/60 px-3 py-3 text-right text-base font-bold text-primary-700">{money0(r.total)}</td>
                  <td className="bg-green-50/60 px-4 py-3 text-right">
                    <span className="font-bold text-green-800">{money(r.profit)}</span>
                    <span className="block text-xs text-green-700">{r.marginPercent}% margin</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-neutral-100 px-4 py-3 text-xs text-ink-soft">
            Website shows: {s.pricesIncludeGst ? `"Customer pays" (incl. ${s.gstPercent}% GST)` : `"Selling price" + GST`}. Selling price is rounded up to the
            nearest ₹{s.roundTo}
            {s.minimumCharge > 0 && `, minimum ₹${s.minimumCharge}`}.
          </p>
        </div>
      )}
    </div>
  )
}

export const inputCls =
  'w-full rounded-lg border border-neutral-300 bg-white px-3 py-2.5 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20'

export function Field({ label, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
    </label>
  )
}
