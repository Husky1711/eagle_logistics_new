import { Link } from 'react-router-dom'
import { Phone, MessageCircle, Facebook, Twitter, Youtube, Linkedin, Mail } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

const SOCIAL_LINKS = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'twitter', label: 'Twitter', Icon: Twitter },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
  { key: 'gmail', label: 'Gmail', Icon: Mail },
]

/** Slim utility strip — contacts + socials (socials desktop-only to reduce mobile clutter) */
export default function TopBar() {
  const { settings } = useSettings()
  const contact = settings?.contact || {}
  const social = settings?.social || {}

  const telHref = contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : null
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, 'Hi Eagle Logistics, I have a question.')
  const activeSocial = SOCIAL_LINKS.filter((item) => social[item.key])

  if (!contact.phone && !contact.whatsapp && activeSocial.length === 0) return null

  return (
    <div className="w-full bg-red-700 text-white" role="region" aria-label="Contact bar">
      <div className="container-custom flex flex-col gap-2 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between sm:py-3 sm:text-sm">
        <p className="font-medium text-white">
          Have a question?{' '}
          <Link to="/contact" className="font-bold text-white underline-offset-2 hover:underline">
            Contact Us
          </Link>
        </p>

        <div className="flex max-w-full flex-wrap items-center gap-x-4 gap-y-1.5">
          {telHref && (
            <a href={telHref} className="inline-flex min-w-0 items-center gap-1.5 hover:text-white/85">
              <Phone size={14} className="shrink-0" aria-hidden />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 hover:text-white/85"
            >
              <MessageCircle size={14} className="shrink-0" aria-hidden />
              <span>WhatsApp</span>
            </a>
          )}
          {activeSocial.length > 0 && (
            <>
              <span className="hidden h-4 w-px bg-white/30 md:block" aria-hidden />
              <div className="hidden flex-wrap items-center gap-1.5 md:flex" aria-label="Social links">
                {activeSocial.map(({ key, label, Icon }) => {
                  const href = social[key]
                  const external = !href.startsWith('mailto:')
                  return (
                    <a
                      key={key}
                      href={href}
                      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      aria-label={label}
                      title={label}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                    >
                      <Icon size={14} aria-hidden />
                    </a>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
