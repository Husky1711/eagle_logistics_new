import { Plus, Trash2 } from 'lucide-react'
import { slugify } from './format'

/** Zones and the destinations (shown in the website dropdown) that belong to each. */
export default function ZonesPanel({ draft, update }) {
  function addZone() {
    const name = window.prompt('Zone name (e.g. Africa, South America)')
    if (!name?.trim()) return
    const id = slugify(name)
    if (!id || draft.zones.some((z) => z.id === id)) return window.alert('That zone already exists.')
    update((d) => {
      d.zones.push({ id, name: name.trim(), destinations: [] })
      for (const c of d.couriers) {
        c.transit = { ...c.transit, [id]: '' }
        ;(d.rateCards[c.id] ??= {})[id] = { slabs: {}, perKgAbove: null }
      }
    })
  }

  function removeZone(z) {
    if (!window.confirm(`Remove zone "${z.name}" and its rates for every courier?`)) return
    update((d) => {
      d.zones = d.zones.filter((x) => x.id !== z.id)
      for (const c of d.couriers) {
        delete c.transit?.[z.id]
        delete d.rateCards[c.id]?.[z.id]
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        {draft.zones.map((z, i) => (
          <div key={z.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-2">
              <input
                value={z.name}
                onChange={(e) => update((d) => (d.zones[i].name = e.target.value))}
                className="flex-1 rounded-lg border border-transparent px-2 py-1.5 font-display text-lg font-semibold text-heading hover:border-neutral-200 focus:border-primary-500 focus:outline-none"
                aria-label="Zone name"
              />
              <button type="button" onClick={() => removeZone(z)} className="rounded-lg p-2 text-red-700 hover:bg-red-50" aria-label={`Remove ${z.name}`}>
                <Trash2 size={16} />
              </button>
            </div>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Destinations in this zone — one per line ({z.destinations.length})
              </span>
              <textarea
                rows={Math.min(8, Math.max(3, z.destinations.length + 1))}
                value={z.destinations.join('\n')}
                onChange={(e) => update((d) => (d.zones[i].destinations = e.target.value.split('\n')))}
                onBlur={() => update((d) => (d.zones[i].destinations = d.zones[i].destinations.map((s) => s.trim()).filter(Boolean)))}
                className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm leading-6 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </label>
          </div>
        ))}
      </div>
      <button type="button" onClick={addZone} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline">
        <Plus size={16} /> Add zone
      </button>
      <p className="text-xs text-ink-soft">Each destination can only be in one zone. Customers pick these names on the website’s Price Calculator.</p>
    </div>
  )
}
