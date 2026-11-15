import { Trash2 } from 'lucide-react'
import { slugify } from './format'
import { ConfirmButton, InlineAdd } from '../ui'

const num = (v) => (v === '' ? '' : Number(v))

/** Per-courier margins + transit times. */
export default function CouriersPanel({ draft, update }) {
  /** Returns an error message, or nothing on success. */
  function addCourier(name) {
    if (!name) return 'Type a courier name'
    const id = slugify(name)
    if (!id) return 'Use letters or numbers in the name'
    if (draft.couriers.some((c) => c.id === id || c.name.toLowerCase() === name.toLowerCase())) return 'That courier already exists'
    update((d) => {
      d.couriers.push({
        id,
        name,
        active: false,
        discountPercent: 0,
        fuelPercent: 0,
        commissionPercent: 15,
        commissionFlat: 0,
        transit: Object.fromEntries(d.zones.map((z) => [z.id, ''])),
      })
      d.rateCards[id] = Object.fromEntries(d.zones.map((z) => [z.id, { slabs: {}, perKgAbove: null }]))
    })
  }

  function removeCourier(c) {
    update((d) => {
      d.couriers = d.couriers.filter((x) => x.id !== c.id)
      delete d.rateCards[c.id]
    })
  }

  const setField = (i, key) => (e) =>
    update((d) => {
      d.couriers[i][key] = e.target.type === 'checkbox' ? e.target.checked : num(e.target.value)
    })

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-soft">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="px-4 py-3">Courier</th>
              <th className="px-3 py-3">Show on website</th>
              <th className="px-3 py-3" title="Discount the courier gives you off their published rates">Your discount %</th>
              <th className="px-3 py-3" title="Fuel surcharge the courier adds (changes monthly)">Fuel surcharge %</th>
              <th className="px-3 py-3" title="Your margin on top of your cost">Commission %</th>
              <th className="px-3 py-3" title="Fixed amount added per shipment (packing, pickup)">+ Flat ₹ per parcel</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {draft.couriers.map((c, i) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <input
                    value={c.name}
                    onChange={(e) => update((d) => (d.couriers[i].name = e.target.value))}
                    className="w-32 rounded-lg border border-transparent px-2 py-1.5 font-semibold text-heading hover:border-neutral-200 focus:border-primary-500 focus:outline-none"
                    aria-label="Courier name"
                  />
                </td>
                <td className="px-3 py-3">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={c.active} onChange={setField(i, 'active')} className="peer sr-only" />
                    <span className="relative h-6 w-11 rounded-full bg-neutral-300 transition after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:bg-green-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500" />
                    <span className="text-xs text-ink-soft">{c.active ? 'On' : 'Off'}</span>
                  </label>
                </td>
                {['discountPercent', 'fuelPercent', 'commissionPercent', 'commissionFlat'].map((k) => (
                  <td key={k} className="px-3 py-3">
                    <div className="relative w-28">
                      {k === 'commissionFlat' && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-soft">₹</span>}
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={c[k]}
                        onChange={setField(i, k)}
                        className={`w-full rounded-lg border border-neutral-300 py-2 text-right focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 ${
                          k === 'commissionFlat' ? 'pl-6 pr-2.5' : 'pl-2.5 pr-7'
                        }`}
                      />
                      {k !== 'commissionFlat' && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft">%</span>}
                    </div>
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <ConfirmButton
                    onConfirm={() => removeCourier(c)}
                    question="Remove + rate card?"
                    confirmLabel="Remove"
                    label={`Remove ${c.name}`}
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </ConfirmButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="border-t border-neutral-100 px-4 py-3">
          <InlineAdd label="Add courier" placeholder="e.g. Aramex, DTDC, Blue Dart" onAdd={addCourier} />
        </div>
      </div>

      <div>
        <h2 className="font-display text-lg font-semibold text-heading">Delivery time shown to customers</h2>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-soft">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-ink-soft">
              <tr>
                <th className="px-4 py-3">Courier</th>
                {draft.zones.map((z) => (
                  <th key={z.id} className="px-3 py-3">
                    {z.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {draft.couriers.map((c, i) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-semibold text-heading">{c.name}</td>
                  {draft.zones.map((z) => (
                    <td key={z.id} className="px-3 py-2.5">
                      <input
                        value={c.transit?.[z.id] || ''}
                        onChange={(e) =>
                          update((d) => {
                            d.couriers[i].transit = { ...d.couriers[i].transit, [z.id]: e.target.value }
                          })
                        }
                        placeholder="e.g. 3-5 days"
                        className="w-full min-w-[96px] rounded-lg border border-neutral-300 px-2.5 py-1.5 focus:border-primary-500 focus:outline-none"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
