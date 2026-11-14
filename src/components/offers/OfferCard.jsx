import { CalendarDays, MapPin, MessageCircle, Tag } from 'lucide-react'
import { validityText } from '../../utils/offers'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

/**
 * One offer as shown on the Offers page (also used as the live preview in the admin).
 * Banner images are best at 1200 × 800 px (3:2).
 */
export default function OfferCard({ offer, whatsapp, preview = false }) {
  const validity = validityText(offer)
  const waUrl = buildWhatsAppUrl(
    whatsapp,
    `Hi Eagle Logistics, I'm interested in your offer: ${offer.title}${offer.promoCode ? ` (code ${offer.promoCode})` : ''}.`,
  )

  return (
    <article className={`flex flex-col overflow-hidden ${preview ? '' : 'h-full '} rounded-2xl border border-neutral-200 bg-white shadow-soft`}>
      <div className="relative aspect-[3/2] bg-primary-50">
        {offer.image ? (
          <img
            src={offer.image}
            alt={offer.title}
            loading={preview ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">
            {preview ? 'Upload a banner (1200 × 800 px)' : null}
          </div>
        )}
        {offer.priceText && (
          <span className="absolute bottom-3 left-3 rounded-lg bg-[#FFD400] px-3 py-1.5 font-display text-lg font-bold text-neutral-900 shadow-md">
            {offer.priceText}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold text-heading">{offer.title || 'Offer title'}</h3>
        {offer.description && <p className="mt-2 text-sm leading-relaxed text-ink">{offer.description}</p>}

        <div className="mt-4 space-y-2 text-sm text-ink">
          {offer.destinations?.length > 0 && (
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary-500" aria-hidden />
              <span>{offer.destinations.join(' · ')}</span>
            </p>
          )}
          {validity && (
            <p className="flex items-center gap-2">
              <CalendarDays size={16} className="shrink-0 text-primary-500" aria-hidden />
              <span>{validity}</span>
            </p>
          )}
          {offer.promoCode && (
            <p className="flex items-center gap-2">
              <Tag size={16} className="shrink-0 text-primary-500" aria-hidden />
              <span>
                Code <strong className="font-mono tracking-wide text-heading">{offer.promoCode}</strong>
              </span>
            </p>
          )}
        </div>

        <div className="mt-auto pt-5">
          {waUrl && (
            <a
              href={preview ? undefined : waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center"
              aria-disabled={preview || undefined}
            >
              <MessageCircle className="mr-2 inline" size={18} aria-hidden />
              Book this offer
            </a>
          )}
          {offer.terms && <p className="mt-2 text-center text-xs text-ink-soft">*{offer.terms}</p>}
        </div>
      </div>
    </article>
  )
}
