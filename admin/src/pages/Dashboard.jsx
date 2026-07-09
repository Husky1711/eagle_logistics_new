import { Link } from 'react-router-dom'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-dark">Dashboard</h1>
        <p className="mt-2 text-neutral-600">
          Project 2 Sprint 1 — edit settings and offers. Changes sync to the public site automatically.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link to="/settings" className="rounded-xl border border-neutral-200 bg-white p-6 shadow-soft hover:border-primary-500">
          <h2 className="font-semibold">Site settings</h2>
          <p className="mt-2 text-sm text-neutral-600">Contact details, header menu, footer links</p>
        </Link>
        <Link to="/offers" className="rounded-xl border border-neutral-200 bg-white p-6 shadow-soft hover:border-primary-500">
          <h2 className="font-semibold">Promotional offer</h2>
          <p className="mt-2 text-sm text-neutral-600">Offer strip title, dates, code, and CTA</p>
        </Link>
      </div>
    </div>
  )
}
