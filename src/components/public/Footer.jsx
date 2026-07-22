import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { assetUrl } from '../../utils/assets'

export default function Footer() {
  const navigate = useNavigate()
  const { settings } = useSettings()
  const site = settings?.site || {}
  const footer = settings?.footer || {}
  const contact = settings?.contact || {}
  const navLinks = footer.quickLinks?.length
    ? footer.quickLinks
    : settings?.header?.menuItems || []
  const supportLinks = footer.supportLinks || []
  const flagSrc = assetUrl(footer.flagImage || '/assets/brand/footer-flags.jpg')
  const [trackingNumber, setTrackingNumber] = useState('')

  const websiteHref = contact.website
    ? contact.website.startsWith('http')
      ? contact.website
      : `https://${contact.website}`
    : null
  const websiteLabel = contact.website?.replace(/^https?:\/\//, '') || ''
  const phones = [contact.phone, contact.phoneSecondary].filter(Boolean)
  const addressLine = (contact.address || '').replace(/\n+/g, ', ')

  function handleTrack(e) {
    e.preventDefault()
    const q = trackingNumber.trim()
    navigate(q ? `/tracking?tn=${encodeURIComponent(q)}` : '/tracking')
  }

  return (
    <footer className="relative w-full overflow-hidden bg-primary-900 text-white">
      <div className="pointer-events-none absolute inset-y-0 left-0 w-full lg:w-[58%]" aria-hidden>
        <img
          src={flagSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary-900/30 to-primary-900 lg:hidden" />
        <div
          className="absolute inset-0 hidden lg:block"
          style={{
            background:
              'linear-gradient(90deg, rgba(10,51,82,0) 0%, rgba(10,51,82,0) 36%, rgba(10,51,82,0.28) 52%, rgba(10,51,82,0.62) 68%, rgba(10,51,82,0.9) 84%, #0a3352 100%)',
          }}
        />
      </div>

      <div className="relative z-10 grid lg:min-h-[400px] lg:grid-cols-[minmax(260px,38%)_minmax(0,62%)]">
        <aside className="relative min-h-[200px] lg:min-h-full">
          <span className="sr-only">India and United States flags</span>
        </aside>

        <div className="relative flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-12 lg:py-12 xl:pr-16">
          <div className="grid gap-10 sm:grid-cols-2 xl:grid-cols-3 xl:gap-12">
            <div>
              <h3 className="font-display text-lg font-bold text-heading-footer">
                {site.name || 'Eagle Logistics'}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-white/85 transition-colors hover:text-heading-footer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-heading-footer">Track Shipment</h3>
              <form onSubmit={handleTrack} className="mt-5 space-y-3">
                <label htmlFor="footer-tracking" className="block text-sm text-white/70">
                  Tracking Number
                </label>
                <input
                  id="footer-tracking"
                  type="text"
                  name="trackingNumber"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded-lg border-0 px-3.5 py-2.5 text-sm text-ink outline-none ring-2 ring-transparent focus:ring-heading-footer"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-heading-bright"
                >
                  Track Now
                </button>
              </form>
            </div>

            <div className="sm:col-span-2 xl:col-span-1">
              <h3 className="font-display text-lg font-bold text-heading-footer">Contact Us</h3>
              <div className="mt-5 space-y-3 text-sm leading-relaxed [&_p]:text-white/90">
                {contact.companyName && (
                  <p className="font-semibold !text-white">{contact.companyName}</p>
                )}
                {addressLine && (
                  <p className="flex gap-2.5 !text-white/90">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-heading-footer" aria-hidden />
                    <span>{addressLine}</span>
                  </p>
                )}
                {phones.map((phone) => (
                  <p key={phone} className="flex items-center gap-2.5 !text-white/90">
                    <Phone className="h-4 w-4 shrink-0 text-heading-footer" aria-hidden />
                    <a href={`tel:${phone.replace(/[\s-]/g, '')}`} className="text-white/90 hover:text-heading-footer">
                      {phone}
                    </a>
                  </p>
                ))}
                {contact.email && (
                  <p className="flex items-center gap-2.5 !text-white/90">
                    <Mail className="h-4 w-4 shrink-0 text-heading-footer" aria-hidden />
                    <a href={`mailto:${contact.email}`} className="text-white/90 hover:text-heading-footer">
                      {contact.email}
                    </a>
                  </p>
                )}
                {websiteHref && (
                  <p className="!text-white/90">
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-heading-footer hover:underline"
                    >
                      {websiteLabel}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            {supportLinks.length > 0 && (
              <ul className="flex flex-wrap gap-x-4 gap-y-2">
                {supportLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-xs text-white/55 transition-colors hover:text-heading-footer"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} {site.name || 'Eagle Logistics'}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
