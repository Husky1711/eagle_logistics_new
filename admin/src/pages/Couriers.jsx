import { cloneElement, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PUBLIC_SITE_URL } from '../config/publicSite'
import Modal from '../components/Modal'

const PUBLIC_SITE = PUBLIC_SITE_URL

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
    <div className="flex h-full flex-col">
      <label className="block" htmlFor={id}>
        <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
      </label>
      {control}
      {hint ? (
        <p id={hintId} className="mt-1.5 text-xs leading-snug text-neutral-500">
          {hint}
        </p>
      ) : null}
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

function emptyDraft(items) {
  const order = nextDisplayOrder(items)
  return {
    name: '',
    id: '',
    logo: '',
    tracking_url: 'https://example.com/track/{id}',
    description: '',
    active: true,
    display_order: order,
    idTouched: false,
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
  const [addOpen, setAddOpen] = useState(false)
  const [draft, setDraft] = useState(() => emptyDraft([]))
  const [draftError, setDraftError] = useState('')

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

  const openAddModal = () => {
    setDraftError('')
    setDraft(emptyDraft(data || []))
    setAddOpen(true)
  }

  const closeAddModal = () => {
    setAddOpen(false)
    setDraftError('')
  }

  const updateDraft = (patch) => {
    setDraft((current) => ({ ...current, ...patch }))
  }

  const handleDraftNameBlur = () => {
    if (draft.idTouched) return
    const slug = slugify(draft.name)
    if (slug) updateDraft({ id: slug })
  }

  const confirmAddCourier = () => {
    const name = draft.name.trim()
    const id = slugify(draft.id || draft.name)
    const logo = draft.logo.trim()
    const tracking = draft.tracking_url.trim()

    if (!name) {
      setDraftError('Name is required.')
      return
    }
    if (!id) {
      setDraftError('Courier ID is required (lowercase slug).')
      return
    }
    if ((data || []).some((item) => item.id === id)) {
      setDraftError(`Courier ID “${id}” already exists.`)
      return
    }
    if (!logo) {
      setDraftError('Logo filename is required.')
      return
    }
    if (!tracking.includes('{id}')) {
      setDraftError('Tracking URL must include the literal text {id}.')
      return
    }

    const rowKey = `new-${Date.now()}`
    setNewRowState((current) => ({ ...current, [rowKey]: { idTouched: true } }))
    setData((current) => [
      ...current,
      {
        _rowKey: rowKey,
        id,
        name,
        logo,
        tracking_url: tracking,
        description: draft.description.trim(),
        active: draft.active,
        display_order: draft.display_order || nextDisplayOrder(current),
      },
    ])
    setMessage('')
    setError('')
    closeAddModal()
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
      const sortedItems = sortCouriers(updated)
      setData(sortedItems.map((item) => ({ ...item, _rowKey: item.id })))
      setInitialIds(new Set(sortedItems.map((item) => item.id)))
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
    <>
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
            onClick={openAddModal}
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

      <Modal
        open={addOpen}
        title="Add courier"
        onClose={closeAddModal}
        footer={
          <>
            <button
              type="button"
              onClick={closeAddModal}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmAddCourier}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600"
            >
              Add to list
            </button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          Fill in the new partner, then click <strong>Add to list</strong>. Click{' '}
          <strong>Save couriers</strong> on the page to sync to the public site.
        </p>

        <div className="grid items-start gap-x-4 gap-y-4 sm:grid-cols-2">
          <Field label="Name" id="add-courier-name">
            <input
              className={inputClassName()}
              value={draft.name}
              onChange={(e) => updateDraft({ name: e.target.value })}
              onBlur={handleDraftNameBlur}
              placeholder="e.g. DTDC"
            />
          </Field>
          <Field
            label="Courier ID"
            id="add-courier-id"
            hint="Lowercase slug. Auto-filled from name until you edit it."
          >
            <input
              className={inputClassName()}
              value={draft.id}
              onChange={(e) => updateDraft({ id: e.target.value.toLowerCase(), idTouched: true })}
              placeholder="e.g. dtdc"
            />
          </Field>
          <Field
            label="Logo filename"
            id="add-courier-logo"
            hint="File in public/assets/couriers/"
          >
            <input
              className={inputClassName()}
              value={draft.logo}
              onChange={(e) => updateDraft({ logo: e.target.value })}
              placeholder="e.g. dtdc.png"
            />
          </Field>
          <Field label="Display order" id="add-courier-order">
            <input
              type="number"
              min={1}
              className={inputClassName()}
              value={draft.display_order}
              onChange={(e) =>
                updateDraft({ display_order: Number.parseInt(e.target.value, 10) || 1 })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field
              label="Tracking URL"
              id="add-courier-tracking"
              hint="Must include the literal text {id}."
            >
              <input
                className={inputClassName()}
                value={draft.tracking_url}
                onChange={(e) => updateDraft({ tracking_url: e.target.value })}
              />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Description" id="add-courier-description">
              <textarea
                className={inputClassName()}
                rows={2}
                value={draft.description}
                onChange={(e) => updateDraft({ description: e.target.value })}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => updateDraft({ active: e.target.checked })}
            />
            Active
          </label>
        </div>

        {draftError ? <p className="text-sm text-red-600">{draftError}</p> : null}
      </Modal>
    </>
  )
}
