import { cloneElement, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const PUBLIC_SITE = import.meta.env.VITE_PUBLIC_SITE_URL || 'http://localhost:5173'

function Field({ label, hint, children, id }) {
  const hintId = hint ? `${id}-hint` : undefined
  const control =
    typeof children === 'object' && children !== null
      ? cloneElement(children, {
          id,
          'aria-describedby': hintId,
        })
      : children

  return (
    <div>
      <label className="block" htmlFor={id}>
        <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      </label>
      {hint && (
        <p id={hintId} className="mb-1 text-xs text-neutral-500">
          {hint}
        </p>
      )}
      {control}
    </div>
  )
}

function inputClassName(locked = false) {
  return `w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm${
    locked ? ' bg-neutral-100 text-neutral-600' : ''
  }`
}

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function fieldKey(rowKey, field) {
  return `courier-${rowKey}-${field}`
}

function sortCouriers(items) {
  return [...items].sort((a, b) => a.display_order - b.display_order)
}

function nextDisplayOrder(items) {
  if (!items.length) return 1
  return Math.max(...items.map((item) => item.display_order)) + 1
}

function newCourierTemplate(items, rowKey) {
  const order = nextDisplayOrder(items)
  return {
    _rowKey: rowKey,
    id: `courier-${order}`,
    name: 'New Courier',
    logo: 'courier.png',
    tracking_url: 'https://example.com/track/{id}',
    description: '',
    active: true,
    display_order: order,
  }
}

function stripRowKey(courier) {
  const { _rowKey, ...rest } = courier
  return rest
}

function CourierLogo({ filename }) {
  const [failed, setFailed] = useState(false)
  const src = `${PUBLIC_SITE}/assets/couriers/${filename}`

  if (!filename || failed) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400">
        No logo
      </div>
    )
  }

  return (
    <img
      src={src}
      alt=""
      className="h-12 w-12 rounded-lg border border-neutral-200 bg-white object-contain p-1"
      onError={() => setFailed(true)}
    />
  )
}

export default function Couriers() {
  const [data, setData] = useState(null)
  const [initialIds, setInitialIds] = useState(() => new Set())
  const [newRowState, setNewRowState] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getCouriers()
      .then((items) => {
        const sorted = sortCouriers(items)
        setData(sorted.map((item) => ({ ...item, _rowKey: item.id })))
        setInitialIds(new Set(sorted.map((item) => item.id)))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const sorted = useMemo(() => (data ? sortCouriers(data) : []), [data])

  const isLockedId = (courier) => initialIds.has(courier.id)

  const updateCourier = (rowKey, patch) => {
    setData((current) =>
      current.map((item) => (item._rowKey === rowKey ? { ...item, ...patch } : item)),
    )
  }

  const addCourier = () => {
    const rowKey = `new-${Date.now()}`
    setNewRowState((current) => ({ ...current, [rowKey]: { idTouched: false } }))
    setData((current) => [...current, newCourierTemplate(current, rowKey)])
  }

  const removeCourier = (rowKey, name) => {
    if (!window.confirm(`Remove ${name}?`)) return
    setData((current) => current.filter((item) => item._rowKey !== rowKey))
    setNewRowState((current) => {
      const next = { ...current }
      delete next[rowKey]
      return next
    })
  }

  const moveCourier = (rowKey, direction) => {
    const ordered = sortCouriers(data)
    const index = ordered.findIndex((item) => item._rowKey === rowKey)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= ordered.length) return

    const reordered = [...ordered]
    const currentOrder = reordered[index].display_order
    reordered[index] = { ...reordered[index], display_order: reordered[targetIndex].display_order }
    reordered[targetIndex] = { ...reordered[targetIndex], display_order: currentOrder }

    setData(reordered)
  }

  const handleNameBlur = (courier) => {
    if (isLockedId(courier)) return
    const rowMeta = newRowState[courier._rowKey]
    if (rowMeta?.idTouched) return
    const slug = slugify(courier.name)
    if (slug && slug !== courier.id) {
      updateCourier(courier._rowKey, { id: slug })
    }
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const payload = sortCouriers(data).map((item, index) => ({
        ...stripRowKey(item),
        display_order: index + 1,
      }))
      const updated = await api.updateCouriers(payload)
      const sorted = sortCouriers(updated)
      setData(sorted.map((item) => ({ ...item, _rowKey: item.id })))
      setInitialIds(new Set(sorted.map((item) => item.id)))
      setNewRowState({})
      setMessage('Couriers saved and synced to public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading couriers…</p>
  if (!data) return <p className="text-red-600">{error || 'Failed to load couriers'}</p>

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-dark">Couriers</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Manage courier partners shown on Home, Tracking, and Pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={addCourier}
          className="rounded-lg border border-primary-500 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-orange-50"
        >
          + Add courier
        </button>
      </div>

      <div className="space-y-4">
        {sorted.map((courier, index) => {
          const lockedId = isLockedId(courier)
          const rowKey = courier._rowKey

          return (
            <section
              key={rowKey}
              className="rounded-xl border border-neutral-200 bg-white p-5 shadow-soft"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <CourierLogo filename={courier.logo} />
                  <div>
                    <h2 className="font-semibold text-dark">{courier.name || 'Unnamed courier'}</h2>
                    <p className="text-xs text-neutral-500">ID: {courier.id}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={courier.active}
                      onChange={(e) => updateCourier(rowKey, { active: e.target.checked })}
                    />
                    Active
                  </label>
                  <button
                    type="button"
                    onClick={() => moveCourier(rowKey, -1)}
                    disabled={index === 0}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCourier(rowKey, 1)}
                    disabled={index === sorted.length - 1}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-40"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCourier(rowKey, courier.name)}
                    className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Name" id={fieldKey(rowKey, 'name')}>
                  <input
                    className={inputClassName()}
                    value={courier.name}
                    onChange={(e) => updateCourier(rowKey, { name: e.target.value })}
                    onBlur={() => handleNameBlur(courier)}
                    required
                  />
                </Field>
                <Field
                  label="Courier ID"
                  id={fieldKey(rowKey, 'id')}
                  hint={
                    lockedId
                      ? 'Locked after save — used by pricing rules.'
                      : 'Lowercase slug (e.g. dtdc). Auto-filled from name until you edit this field.'
                  }
                >
                  <input
                    className={inputClassName(lockedId)}
                    value={courier.id}
                    readOnly={lockedId}
                    onChange={(e) => {
                      setNewRowState((current) => ({
                        ...current,
                        [rowKey]: { idTouched: true },
                      }))
                      updateCourier(rowKey, { id: e.target.value.toLowerCase() })
                    }}
                    required
                  />
                </Field>
                <Field
                  label="Logo filename"
                  id={fieldKey(rowKey, 'logo')}
                  hint="File in public/assets/couriers/ (e.g. dtdc.png)."
                >
                  <input
                    className={inputClassName()}
                    value={courier.logo}
                    onChange={(e) => updateCourier(rowKey, { logo: e.target.value })}
                    required
                  />
                </Field>
                <Field
                  label="Display order"
                  id={fieldKey(rowKey, 'order')}
                  hint="Re-normalized on save (1, 2, 3…)."
                >
                  <input
                    type="number"
                    min={1}
                    className={inputClassName()}
                    value={courier.display_order}
                    onChange={(e) =>
                      updateCourier(rowKey, {
                        display_order: Number.parseInt(e.target.value, 10) || 1,
                      })
                    }
                    required
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field
                    label="Tracking URL"
                    id={fieldKey(rowKey, 'tracking')}
                    hint="Must include the literal text {id} for the tracking number."
                  >
                    <input
                      className={inputClassName()}
                      value={courier.tracking_url}
                      onChange={(e) => updateCourier(rowKey, { tracking_url: e.target.value })}
                      required
                    />
                  </Field>
                </div>
                <div className="md:col-span-2">
                  <Field label="Description" id={fieldKey(rowKey, 'description')}>
                    <textarea
                      className={inputClassName()}
                      rows={2}
                      value={courier.description}
                      onChange={(e) => updateCourier(rowKey, { description: e.target.value })}
                    />
                  </Field>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving || data.length === 0}
        className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save couriers'}
      </button>
    </form>
  )
}
