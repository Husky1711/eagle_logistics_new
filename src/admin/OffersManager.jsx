import { useCallback, useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Home, Pencil, Plus, Trash2 } from 'lucide-react'
import { api } from './api'
import OfferEditor from './OfferEditor'
import { ConfirmButton } from './ui'
import { offerStatus, validityText } from '../utils/offers'

const STATUS = {
  live: { label: 'Live', className: 'bg-green-100 text-green-800' },
  scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
  expired: { label: 'Expired', className: 'bg-neutral-200 text-neutral-700' },
  off: { label: 'Hidden', className: 'bg-amber-100 text-amber-800' },
}

export default function OffersManager({ onAuthLost }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [editing, setEditing] = useState(null)

  const handle = useCallback(
    (err) => {
      if (err.status === 401) onAuthLost()
      else setError(err.message)
    },
    [onAuthLost],
  )

  const load = useCallback(() => {
    api.offers().then(setData).catch(handle)
  }, [handle])

  useEffect(() => {
    load()
  }, [load])

  function flash(message) {
    setNotice(message)
    setError('')
    window.setTimeout(() => setNotice(''), 3500)
  }

  async function save(offer) {
    const res = await api.saveOffer(offer).catch((err) => {
      if (err.status === 401) onAuthLost()
      throw err
    })
    setData((d) => ({ ...d, offers: res.offers }))
    setEditing(null)
    flash('Offer saved — it’s on the website now.')
  }

  async function remove(offer) {
    try {
      const res = await api.deleteOffer(offer.id)
      setData((d) => ({ ...d, offers: res.offers }))
      flash('Offer deleted.')
    } catch (err) {
      handle(err)
    }
  }

  async function move(index, delta) {
    const offers = [...data.offers]
    const target = index + delta
    if (target < 0 || target >= offers.length) return
    ;[offers[index], offers[target]] = [offers[target], offers[index]]
    setData((d) => ({ ...d, offers }))
    try {
      const res = await api.reorderOffers(offers.map((o) => o.id))
      setData((d) => ({ ...d, offers: res.offers }))
    } catch (err) {
      handle(err)
      load()
    }
  }

  if (!data) {
    return <p className="text-ink">{error || 'Loading offers…'}</p>
  }

  const today = data.today
  const homeOffer = data.offers.find((o) => offerStatus(o, today) === 'live' && o.showOnHome && o.homeStripText)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-heading">Offers</h1>
          <p className="mt-1 text-sm text-ink">
            Live offers show on the Offers page in this order. Changes appear on the website straight away.
          </p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="btn-primary">
          <Plus size={18} className="mr-1.5" aria-hidden />
          New offer
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-primary-200 bg-white px-4 py-3 text-sm text-ink">
        <span className="inline-flex items-center gap-1.5 font-semibold text-heading">
          <Home size={16} aria-hidden /> Home page strip:
        </span>{' '}
        {homeOffer ? `“${homeOffer.homeStripText}”` : <em>none — no live offer is set to show on the home page</em>}
      </div>

      {notice && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800" role="status">{notice}</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}

      {data.offers.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-white p-10 text-center text-ink">
          No offers yet. Click <strong>New offer</strong> to add one.
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {data.offers.map((offer, i) => {
            const status = STATUS[offerStatus(offer, today)]
            return (
              <li key={offer.id} className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-soft sm:flex-row sm:items-center">
                <div className="aspect-[3/2] w-full shrink-0 overflow-hidden rounded-lg bg-primary-50 sm:w-36">
                  {offer.image && <img src={offer.image} alt="" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${status.className}`}>{status.label}</span>
                    {offer.showOnHome && (
                      <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-bold text-primary-700">Home strip</span>
                    )}
                  </div>
                  <h2 className="mt-1.5 truncate font-display text-lg font-semibold text-heading">{offer.title}</h2>
                  <p className="text-sm text-ink">
                    {[offer.priceText, validityText(offer) || 'No end date', offer.promoCode && `Code ${offer.promoCode}`]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1">
                  <IconButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0} icon={ArrowUp} />
                  <IconButton label="Move down" onClick={() => move(i, 1)} disabled={i === data.offers.length - 1} icon={ArrowDown} />
                  <IconButton
                    label="Duplicate"
                    onClick={() => setEditing({ ...offer, id: undefined, title: `${offer.title} (copy)`, active: false })}
                    icon={Copy}
                  />
                  <button type="button" onClick={() => setEditing(offer)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 px-3 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-50">
                    <Pencil size={15} aria-hidden /> Edit
                  </button>
                  <ConfirmButton
                    onConfirm={() => remove(offer)}
                    question="Delete offer?"
                    label="Delete"
                    className="rounded-lg p-2 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={18} aria-hidden />
                  </ConfirmButton>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editing && <OfferEditor initial={editing} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  )
}

function IconButton({ label, onClick, icon: Icon, disabled, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg p-2 disabled:opacity-30 ${danger ? 'text-red-700 hover:bg-red-50' : 'text-ink hover:bg-neutral-100'}`}
    >
      <Icon size={18} aria-hidden />
    </button>
  )
}
