import { useState } from 'react'
import { Percent } from 'lucide-react'
import { InlineAdd } from '../ui'

/**
 * Courier rate card grid: rows = weight slabs, columns = zones, cells = published ₹ rate.
 * Blank cell = courier doesn't serve that weight/zone. Last row = ₹ per extra kg above the top slab.
 */
export default function RateCardsPanel({ draft, update }) {
  const [courierId, setCourierId] = useState(draft.couriers[0]?.id)
  const courier = draft.couriers.find((c) => c.id === courierId) || draft.couriers[0]
  if (!courier) return <p className="text-ink">Add a courier first.</p>

  const slabs = draft.settings.slabWeights
  const top = slabs[slabs.length - 1]
  const card = draft.rateCards[courier.id] || {}

  function setCell(zoneId, weight, value) {
    update((d) => {
      const zc = (d.rateCards[courier.id] ??= {})[zoneId] ?? { slabs: {}, perKgAbove: null }
      zc.slabs = { ...zc.slabs }
      if (value === '') delete zc.slabs[String(weight)]
      else zc.slabs[String(weight)] = Number(value)
      d.rateCards[courier.id][zoneId] = zc
    })
  }

  function setAbove(zoneId, value) {
    update((d) => {
      const zc = (d.rateCards[courier.id] ??= {})[zoneId] ?? { slabs: {}, perKgAbove: null }
      zc.perKgAbove = value === '' ? null : Number(value)
      d.rateCards[courier.id][zoneId] = zc
    })
  }

  /** Returns an error message, or nothing on success. */
  function adjustAll(input) {
    const pct = Number(input)
    if (input === '' || !Number.isFinite(pct) || pct === 0 || pct <= -90 || pct > 300) return 'Enter a % like 5 (increase) or -3 (decrease)'
    update((d) => {
      for (const zc of Object.values(d.rateCards[courier.id] || {})) {
        for (const w of Object.keys(zc.slabs || {})) zc.slabs[w] = Math.round(zc.slabs[w] * (1 + pct / 100))
        if (zc.perKgAbove != null) zc.perKgAbove = Math.round(zc.perKgAbove * (1 + pct / 100))
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Courier">
          {draft.couriers.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={c.id === courier.id}
              onClick={() => setCourierId(c.id)}
              className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                c.id === courier.id ? 'bg-primary-900 text-white' : 'bg-white text-ink ring-1 ring-neutral-200 hover:ring-primary-300'
              }`}
            >
              {c.name}
              {!c.active && <span className="ml-1.5 text-[11px] font-medium opacity-70">(off)</span>}
            </button>
          ))}
        </div>
        <InlineAdd
          key={courier.id}
          icon={Percent}
          label={`Adjust all ${courier.name} rates by %`}
          placeholder="e.g. 5 or -3"
          inputType="number"
          submitLabel="Apply"
          onAdd={adjustAll}
        />
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-2xl border border-neutral-200 bg-white shadow-soft">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-neutral-50 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="sticky left-0 z-20 border-b border-neutral-200 bg-neutral-50 px-4 py-3">Weight up to</th>
              {draft.zones.map((z) => (
                <th key={z.id} className="border-b border-neutral-200 px-2 py-3 text-right">
                  {z.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slabs.map((w) => (
              <tr key={w} className="hover:bg-primary-50/40">
                <th scope="row" className="sticky left-0 border-b border-neutral-100 bg-white px-4 py-1.5 text-left font-semibold text-heading">
                  {w} kg
                </th>
                {draft.zones.map((z) => (
                  <td key={z.id} className="border-b border-neutral-100 px-2 py-1">
                    <RateInput value={card[z.id]?.slabs?.[String(w)]} onChange={(v) => setCell(z.id, w, v)} label={`${courier.name} ${z.name} ${w} kg`} />
                  </td>
                ))}
              </tr>
            ))}
            <tr className="bg-amber-50/60">
              <th scope="row" className="sticky left-0 bg-amber-50 px-4 py-2 text-left font-semibold text-amber-900">
                Each extra kg above {top} kg
              </th>
              {draft.zones.map((z) => (
                <td key={z.id} className="px-2 py-1.5">
                  <RateInput value={card[z.id]?.perKgAbove} onChange={(v) => setAbove(z.id, v)} label={`${courier.name} ${z.name} per kg above ${top} kg`} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-soft">
        Enter the courier’s <strong>published</strong> rates (before your discount). A parcel is charged at the first slab equal to or above its
        weight. Leave a cell blank if {courier.name} doesn’t offer it. Change weight slabs under <em>GST &amp; rules</em>.
      </p>
    </div>
  )
}

function RateInput({ value, onChange, label }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-neutral-400">₹</span>
      <input
        type="number"
        min="0"
        step="1"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="w-full min-w-[84px] rounded-md border border-neutral-200 py-1.5 pl-5 pr-2 text-right tabular-nums focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  )
}
