import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Container from './Container'

/** All pages a "related" row can point to; keeps link text consistent site-wide. */
const PAGES = {
  services: { to: '/services', label: 'Courier & cargo services', hint: 'Domestic, international and cargo' },
  pricing: { to: '/pricing', label: 'Price calculator', hint: 'Compare DHL, FedEx and UPS rates' },
  tracking: { to: '/tracking', label: 'Track a shipment', hint: 'Live status from our partners' },
  thingsWeSend: { to: '/things-we-send', label: 'Things we send abroad', hint: 'Sweets, spices, clothes, books and more' },
  offers: { to: '/offers', label: 'Special offers', hint: 'Festive deals and student rates' },
  airCargo: { to: '/cargo/air', label: 'Air cargo from Bangalore', hint: 'Fast international freight' },
  contact: { to: '/contact', label: 'Contact us', hint: 'Call, email or WhatsApp our Bangalore office' },
}

/**
 * "Explore more" row of in-content links. Helps visitors find the next step and
 * helps search engines understand how the site's pages relate.
 */
export default function RelatedLinks({ pages, title = 'Explore more' }) {
  const items = pages.map((key) => PAGES[key]).filter(Boolean)
  if (items.length === 0) return null

  return (
    <section className="border-t border-neutral-200 bg-white py-10 lg:py-12" aria-labelledby="related-links-title">
      <Container>
        <h2 id="related-links-title" className="font-display text-xl font-bold text-heading lg:text-2xl">
          {title}
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="group flex h-full items-start justify-between gap-3 rounded-xl border border-neutral-200 p-4 transition hover:border-primary-300 hover:bg-primary-50"
              >
                <span>
                  <span className="block font-semibold text-heading">{item.label}</span>
                  <span className="mt-1 block text-sm text-ink">{item.hint}</span>
                </span>
                <ArrowRight
                  size={18}
                  className="mt-0.5 shrink-0 text-primary-500 transition-transform group-hover:translate-x-1"
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
