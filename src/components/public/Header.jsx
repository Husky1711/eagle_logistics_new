import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { assetUrl } from '../../utils/assets'

export default function Header() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { settings } = useSettings()

  const header = settings?.header || {}
  const navItems = header.menuItems || []
  const cta = header.ctaButton || {}
  const logo = assetUrl(header.logo || '/assets/brand/logo.png')

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 shadow-soft backdrop-blur-sm">
      <div className="flex h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:h-20 sm:gap-3 sm:px-4 lg:h-24 lg:px-6">
        <Link
          to="/"
          className="flex min-w-0 flex-1 items-center sm:flex-none"
          onClick={() => setOpen(false)}
        >
          <img
            src={logo}
            alt="Eagle Logistics"
            className="h-10 w-auto max-w-full object-contain object-left sm:h-14 lg:h-20"
          />
        </Link>

        <nav
          className="hidden items-center gap-5 lg:flex xl:gap-6"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`whitespace-nowrap text-sm font-medium transition-colors hover:text-heading ${
                isActive(item.path) ? 'text-heading' : 'text-ink'
              }`}
            >
              {item.label}
            </Link>
          ))}
          {cta.enabled && (
            <Link to={cta.url || '/pricing'} className="btn-primary !px-4 !py-2 text-sm">
              {cta.text || 'Price Calculator'}
            </Link>
          )}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
          {cta.enabled && (
            <Link
              to={cta.url || '/pricing'}
              className="btn-primary !px-2.5 !py-1.5 text-[11px] leading-tight sm:!px-3 sm:!py-2 sm:text-xs"
            >
              {cta.text || 'Price Calculator'}
            </Link>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-ink hover:bg-neutral-100"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-neutral-200 px-3 py-4 lg:hidden" aria-label="Mobile navigation">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-base font-medium ${
                  isActive(item.path)
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-ink hover:bg-neutral-50'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
