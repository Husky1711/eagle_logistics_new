import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { assetUrl } from '../../utils/assets'

export default function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { settings, loading } = useSettings()

  const header = settings?.header || {}
  const navItems = header.menuItems || []
  const cta = header.ctaButton || {}
  const logo = assetUrl(header.logo || '/assets/brand/logo.png')

  const isActive = (path) => location.pathname === path

  if (loading) {
    return (
      <header className="sticky top-0 z-50 h-16 border-b border-neutral-200 bg-white/95 backdrop-blur-sm" />
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
      <div className="container-custom">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <img src={logo} alt="Eagle Logistics" className="h-10 w-auto object-contain sm:h-12" />
          </Link>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-primary-500 ${
                  isActive(item.path) ? 'text-primary-500' : 'text-neutral-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
            {cta.enabled && (
              <Link to={cta.url || '/pricing'} className="btn-primary !px-4 !py-2 text-sm">
                {cta.text || 'Calculate Price'}
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-neutral-200 py-4 lg:hidden" aria-label="Mobile navigation">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-base font-medium ${
                    isActive(item.path)
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              {cta.enabled && (
                <Link
                  to={cta.url || '/pricing'}
                  onClick={() => setOpen(false)}
                  className="btn-primary mt-2 text-center"
                >
                  {cta.text || 'Calculate Price'}
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
