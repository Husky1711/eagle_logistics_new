import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

function formatSavedAt(iso) {
  if (!iso) return 'Not saved yet'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

export default function Dashboard() {
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getMeta()
      .then(setMeta)
      .catch((err) => setError(err.message))
  }, [])

  const cards = [
    {
      to: '/settings',
      title: 'Site settings',
      description: 'Contact details, header menu, footer links',
      savedAt: meta?.settings_saved_at,
    },
    {
      to: '/offers',
      title: 'Promotional offer',
      description: 'Offer strip title, dates, code, and CTA',
      savedAt: meta?.offers_saved_at,
    },
    {
      to: '/couriers',
      title: 'Courier partners',
      description: 'Names, logos, tracking URLs, and display order',
      savedAt: meta?.couriers_saved_at,
    },
    {
      to: '/pricing-rules',
      title: 'Pricing rules',
      description: 'Rate cards for the public shipping calculator',
      savedAt: meta?.pricing_rules_saved_at,
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-dark">Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Edit settings, offers, couriers, and pricing rules. Changes sync to the public site automatically.
        </p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="rounded-xl border border-neutral-200 bg-white p-6 shadow-soft hover:border-primary-500"
          >
            <h2 className="font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-neutral-600">{card.description}</p>
            <p className="mt-3 text-xs text-neutral-500">
              Last saved: {meta ? formatSavedAt(card.savedAt) : 'Loading…'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}
