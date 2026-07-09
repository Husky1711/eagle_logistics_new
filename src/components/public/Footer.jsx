import { Link } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import Container from '../common/Container'
import { assetUrl } from '../../utils/assets'

export default function Footer() {
  const { settings } = useSettings()
  const site = settings?.site || {}
  const footer = settings?.footer || {}

  return (
    <footer className="bg-dark text-neutral-300">
      <Container className="section-padding !py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="mb-4 inline-flex rounded-lg bg-white px-3 py-2 shadow-soft">
              <img
                src={assetUrl('/assets/brand/logo.png')}
                alt={site.name || 'Eagle Logistics'}
                className="h-10 w-auto object-contain"
              />
            </div>
            <p className="max-w-md text-sm leading-relaxed text-neutral-400">
              {footer.description || site.description}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wide text-white">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {(footer.quickLinks || []).map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm hover:text-gold-400">
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
                  <Link to={link.path} className="text-sm hover:text-gold-400">
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
