import { useEffect, useState } from 'react'
import { api } from '../api/client'

function formatJson(data) {
  return `${JSON.stringify(data, null, 2)}\n`
}

export default function PricingRules() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getPricingRules()
      .then((data) => setText(formatJson(data)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')

    let payload
    try {
      payload = JSON.parse(text)
    } catch {
      setError('Invalid JSON — check commas, brackets, and quotes.')
      setSaving(false)
      return
    }

    if (!Array.isArray(payload)) {
      setError('Pricing rules must be a JSON array.')
      setSaving(false)
      return
    }

    try {
      const updated = await api.updatePricingRules(payload)
      setText(formatJson(updated))
      setMessage('Pricing rules saved and synced to public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading pricing rules…</p>

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-dark">Pricing rules</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Rate card for the public calculator: each rule links to a courier id (
          <code className="rounded bg-neutral-100 px-1">courier</code>) with weight bands and distance
          zones. Formula on site: base_price + (weight × price_per_kg).
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Rule ids are locked after save — add a new rule instead of renaming. Courier ids must match
          Couriers page.
        </p>
      </div>

      <textarea
        className="min-h-[480px] w-full rounded-xl border border-neutral-300 bg-neutral-50 p-4 font-mono text-xs leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label="Pricing rules JSON"
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save pricing rules'}
      </button>
    </form>
  )
}
