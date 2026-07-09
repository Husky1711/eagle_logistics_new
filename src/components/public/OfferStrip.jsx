import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useContent } from '../../hooks/useContent'
import { isOfferActive } from '../../utils/dates'

const DISMISS_KEY = 'eagle_offer_dismissed'

export default function OfferStrip() {
  const { data: offer, loading } = useContent('offers.json')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  if (loading || !offer || !isOfferActive(offer) || dismissed) return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  return (
    <div className="gradient-gold text-white" role="region" aria-label="Promotional offer">
      <div className="container-custom flex flex-col items-start gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 pr-2">
          <p className="text-sm font-semibold sm:text-base">{offer.title}</p>
          <p className="text-xs text-white/90 sm:text-sm">{offer.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {offer.cta?.url && (
            <Link
              to={offer.cta.url}
              className="rounded-md bg-white px-4 py-1.5 text-xs font-bold text-primary-600 shadow-sm hover:bg-neutral-100 sm:text-sm"
            >
              {offer.cta.text || 'Learn more'}
            </Link>
          )}
          <button
            type="button"
            onClick={dismiss}
            className="rounded p-1 hover:bg-white/20"
            aria-label="Dismiss offer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
