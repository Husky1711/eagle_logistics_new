import { useState } from 'react'
import { X } from 'lucide-react'
import Input from '../components/common/Input'
import OfferCard from '../components/offers/OfferCard'
import { useSettings } from '../context/SettingsContext'
import ImageField from './ImageField'

export const EMPTY_OFFER = {
  title: '',
  priceText: '',
  description: '',
  destinations: [],
  image: '',
  startDate: '',
  endDate: '',
  promoCode: '',
  terms: 'Conditions apply',
  homeStripText: '',
  showOnHome: false,
  active: true,
}

/** Add / edit one offer, with a live preview of how it looks on the site. */
export default function OfferEditor({ initial, onSave, onCancel }) {
  const { settings } = useSettings()
  const [offer, setOffer] = useState({ ...EMPTY_OFFER, ...initial })
  const [destinationsText, setDestinationsText] = useState((initial?.destinations || []).join(', '))
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (k) => (e) => setOffer((o) => ({ ...o, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  const destinations = destinationsText.split(',').map((s) => s.trim()).filter(Boolean)
  const preview = { ...offer, destinations }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!offer.title.trim()) return setError('Give the offer a title')
    if (offer.startDate && offer.endDate && offer.endDate < offer.startDate) {
      return setError('End date must be on or after the start date')
    }
    if (offer.showOnHome && !offer.homeStripText.trim()) {
      return setError('Add the home page strip text, or untick "Show on home page"')
    }
    setBusy(true)
    try {
      await onSave(preview)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-2 sm:p-6" role="dialog" aria-modal="true" aria-labelledby="offer-editor-title">
      <div className="mx-auto max-w-5xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <h2 id="offer-editor-title" className="font-display text-xl font-bold text-heading">
            {initial?.id ? 'Edit offer' : 'New offer'}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-2 text-ink hover:bg-neutral-100" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={submit} noValidate className="grid gap-6 p-5 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Input label="Offer title" value={offer.title} onChange={set('title')} maxLength={120} placeholder="Diwali special to the USA" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Price highlight" value={offer.priceText} onChange={set('priceText')} maxLength={60} placeholder="₹567* per kg" />
              <Input label="Promo code (optional)" value={offer.promoCode} onChange={(e) => setOffer((o) => ({ ...o, promoCode: e.target.value.toUpperCase() }))} maxLength={30} placeholder="DIWALI26" />
            </div>
            <div>
              <label htmlFor="offer-description" className="mb-2 block text-sm font-medium text-ink">
                Short description
              </label>
              <textarea
                id="offer-description"
                rows={3}
                maxLength={600}
                value={offer.description}
                onChange={set('description')}
                placeholder="Send sweets, clothes and gifts to family in the USA with doorstep pickup."
                className="w-full resize-y rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <Input
              label="Destinations (comma separated, optional)"
              value={destinationsText}
              onChange={(e) => setDestinationsText(e.target.value)}
              placeholder="USA, UK, Canada"
            />
            <ImageField
              label="Offer banner"
              value={offer.image}
              onChange={(image) => setOffer((o) => ({ ...o, image }))}
              recommended={{ width: 1200, height: 800 }}
              help="Shown on the offer card. Keep important text away from the bottom-left corner (the price badge sits there)."
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Start date (optional)" type="date" value={offer.startDate} onChange={set('startDate')} />
              <Input label="End date (optional)" type="date" value={offer.endDate} onChange={set('endDate')} />
            </div>
            <p className="-mt-2 text-xs text-ink-soft">
              The offer appears on the start date and disappears automatically after the end date (India time).
            </p>
            <Input label="Terms / small print" value={offer.terms} onChange={set('terms')} maxLength={300} placeholder="Conditions apply" />

            <fieldset className="space-y-3 rounded-xl border border-neutral-200 p-4">
              <legend className="px-1 text-sm font-semibold text-heading">Where it shows</legend>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={offer.active} onChange={set('active')} className="h-4 w-4" />
                <span>
                  <strong>Active</strong> — untick to hide it without deleting
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input type="checkbox" checked={offer.showOnHome} onChange={set('showOnHome')} className="h-4 w-4" />
                <span>Show on the home page strip (the first one in the list wins)</span>
              </label>
              {offer.showOnHome && (
                <Input
                  label="Home page strip text (one line)"
                  value={offer.homeStripText}
                  onChange={set('homeStripText')}
                  maxLength={120}
                  placeholder="Gifts & parcels to the USA from ₹567*/kg · *conditions apply"
                />
              )}
            </fieldset>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-1">
              <button type="submit" disabled={busy} className="btn-primary">
                {busy ? 'Saving…' : 'Save offer'}
              </button>
              <button type="button" onClick={onCancel} className="btn-outline">
                Cancel
              </button>
            </div>
          </div>

          <aside className="lg:sticky lg:top-6 lg:self-start">
            <p className="mb-2 text-sm font-semibold text-heading">Preview on the Offers page</p>
            <OfferCard offer={preview} whatsapp={settings?.contact?.whatsapp} preview />
            {offer.showOnHome && offer.homeStripText && (
              <div className="mt-4">
                <p className="mb-2 text-sm font-semibold text-heading">Home page strip</p>
                <div className="rounded-lg bg-[#0b243d] px-3 py-2.5 text-center text-sm font-medium text-white">
                  {offer.homeStripText} →
                </div>
              </div>
            )}
          </aside>
        </form>
      </div>
    </div>
  )
}
