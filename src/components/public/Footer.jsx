import { Link } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import Container from '../common/Container'
import { assetUrl } from '../../utils/assets'

export default function Footer() {
  const { settings } = useSettings()
  const site = settings?.site || {}
  const footer = settings?.footer || {}
  const logo = assetUrl(settings?.header?.logo || '/assets/brand/logo.png')
  const countries = footer.countries || []

  return (
    <footer className="bg-dark text-neutral-300">
      <Container className="section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 inline-flex rounded-lg bg-white px-3 py-2 shadow-soft">
              <img
                src={logo}
                alt={site.name || 'Eagle Logistics'}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-neutral-400">
              {footer.description || site.description}
            </p>
            {countries.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wide text-white">
                  We ship worldwide
                </h3>
                <ul className="flex flex-wrap gap-3" aria-label="Countries we ship to">
                  {countries.map((country) => (
                    <li
                      key={country.code}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900/40 px-2.5 py-1.5 text-sm"
                      title={country.name}
                    >
                      <span className="text-base leading-none" aria-hidden>
                        {country.flag}
                      </span>
                      <span className="text-xs text-neutral-400">{country.code}</span>
                      <span className="sr-only">{country.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-primary-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white">
              Support
            </h3>
            <ul className="space-y-2">
              {(footer.supportLinks || []).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-primary-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-neutral-700 pt-6 text-center text-sm text-neutral-500">
          © {new Date().getFullYear()} {site.name || 'Eagle Logistics'}. All rights reserved.
        </div>
      </Container>
    </footer>
  )
}
