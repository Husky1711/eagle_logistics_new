import { useEffect, useState } from 'react'
import { api } from '../api/client'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

export default function Offers() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getOffers()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await api.updateOffers(data)
      setData(updated)
      setMessage('Offer saved and synced to public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading offer…</p>
  if (!data) return <p className="text-red-600">{error || 'Failed to load offer'}</p>

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-dark">Promotional offer</h1>
        <p className="mt-2 text-sm text-neutral-600">Controls the offer strip on the public site.</p>
      </div>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={data.active}
            onChange={(e) => setData({ ...data, active: e.target.checked })}
          />
          Offer active
        </label>

        <Field label="Title">
          <input className={inputClassName()} value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} />
        </Field>
        <Field label="Subtitle">
          <textarea className={inputClassName()} rows={2} value={data.subtitle} onChange={(e) => setData({ ...data, subtitle: e.target.value })} />
        </Field>
        <Field label="Promo code">
          <input className={inputClassName()} value={data.code} onChange={(e) => setData({ ...data, code: e.target.value })} />
        </Field>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Start date (YYYY-MM-DD, IST)">
            <input className={inputClassName()} value={data.startDate} onChange={(e) => setData({ ...data, startDate: e.target.value })} />
          </Field>
          <Field label="End date (YYYY-MM-DD, IST)">
            <input className={inputClassName()} value={data.endDate} onChange={(e) => setData({ ...data, endDate: e.target.value })} />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="CTA text">
            <input
              className={inputClassName()}
              value={data.cta.text}
              onChange={(e) => setData({ ...data, cta: { ...data.cta, text: e.target.value } })}
            />
          </Field>
          <Field label="CTA URL">
            <input
              className={inputClassName()}
              value={data.cta.url}
              onChange={(e) => setData({ ...data, cta: { ...data.cta, url: e.target.value } })}
            />
          </Field>
        </div>

        <p className="text-xs text-neutral-500">
          Alternate campaigns (`offers.alternates`) remain in JSON for Project 2 Sprint 3.
        </p>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save offer'}
      </button>
    </form>
  )
}
