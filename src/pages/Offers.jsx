import { Link } from 'react-router-dom'
import { Check, MessageCircle, Tag } from 'lucide-react'
import { useContent, combineContentStates } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import SmartImage from '../components/common/SmartImage'
import { isOfferActive } from '../utils/dates'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { pageImageUrl } from '../utils/assets'

export default function Offers() {
  const pageState = useContent('pages/offers.json')
  const offersState = useContent('offers.json')
  const { settings } = useSettings()
  const { loading, error } = combineContentStates(pageState, offersState)

  return (
    <PageContentGate loading={loading} error={error}>
      <OffersContent page={pageState.data} offers={offersState.data} settings={settings} />
    </PageContentGate>
  )
}

function FeatureList({ title, items, columns = 'sm:grid-cols-2 lg:grid-cols-3' }) {
  if (!items?.length) return null
  return (
    <div>
      {title && <h3 className="font-display text-xl font-semibold text-heading">{title}</h3>}
      <ul className={`mt-4 grid gap-3 ${columns}`}>
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-ink">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Check size={12} aria-hidden />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** One visual unit: yellow rate + poster + CTAs. */
function OfferShowcase({ promoCard, whatsappUrl }) {
  if (!promoCard) return null

  const line1 = promoCard.line1 || 'Send parcels to the USA from Bangalore'
  const line2 = promoCard.line2 || '₹567* per kg'
  const posterSrc = pageImageUrl(promoCard.image)
  const posterAlt = `${line1} ${line2}`.trim()

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-medium">
      <div className="bg-[#FFCC00] px-4 py-4 text-center text-[#1A3668] sm:px-5 sm:py-5">
        <p className="text-sm font-bold uppercase tracking-[0.12em] sm:text-base">Special rate</p>
        <p className="mt-2 font-display text-lg font-extrabold leading-snug sm:text-xl md:text-2xl lg:text-3xl">
          <span className="inline">{line1}</span>
          {' '}
          <span className="inline whitespace-nowrap text-xl sm:text-2xl md:text-3xl lg:text-4xl">{line2}</span>
        </p>
      </div>

      {posterSrc && (
        <SmartImage
          src={posterSrc}
          alt={posterAlt}
          className="block h-auto w-full"
          wrapperClassName="!rounded-none !bg-[#A9C9E0]"
        />
      )}

      <div className="border-t border-neutral-100 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button to="/pricing" className="flex-1 justify-center">
            Price calculator
          </Button>
          {whatsappUrl && (
            <Button href={whatsappUrl} variant="outline" className="flex-1 justify-center">
              <MessageCircle className="mr-2 inline" size={16} aria-hidden />
              WhatsApp
            </Button>
          )}
        </div>
        {promoCard.disclaimer && (
          <p className="mt-2 text-center text-[11px] text-ink-soft">*{promoCard.disclaimer}</p>
        )}
      </div>
    </div>
  )
}

function OffersContent({ page, offers, settings }) {
  const content = page?.content || {}
  const sections = content.sections || []
  const promoCard = content.promoCard
  const promoActive = isOfferActive(offers)

  const whatsappUrl = buildWhatsAppUrl(
    settings?.contact?.whatsapp,
    'Hi Eagle Logistics, I want to know about current special offers.',
  )
  const heroSrc = pageImageUrl(content.heroImage)

  return (
    <>
      <PageMeta meta={page?.meta} />

      <section className="relative overflow-hidden bg-dark text-white">
        {heroSrc && (
          <SmartImage
            src={heroSrc}
            alt=""
            fill
            loading="eager"
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30" />
        <Container className="relative z-10 py-14 text-center lg:py-16">
          <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">{content.title}</h1>
          {content.headline && (
            <p className="mx-auto mt-3 max-w-2xl text-lg text-white/95">{content.headline}</p>
          )}
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container className="space-y-8">
          {promoActive && offers?.title && (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-white px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:gap-5 sm:px-6">
              <span className="inline-flex w-fit shrink-0 items-center gap-1 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white">
                <Tag size={12} aria-hidden />
                {content.currentPromoLabel || 'Current promo'}
              </span>
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold text-heading sm:text-2xl">
                  {offers.title}
                </h2>
                {offers.subtitle && (
                  <p className="mt-1 text-sm text-ink sm:text-base">{offers.subtitle}</p>
                )}
              </div>
            </div>
          )}

          {/* Row 1: story + poster — independent heights, no forced match */}
          <div className="grid items-start gap-6 lg:grid-cols-12 lg:gap-8">
            <div className="space-y-4 lg:col-span-5">
              <Card>
                {content.lead && <p className="text-base text-ink">{content.lead}</p>}
                {content.reassure && (
                  <p className="mt-2 text-base font-semibold text-primary-600">{content.reassure}</p>
                )}
                {(content.body || []).map((paragraph) => (
                  <p key={paragraph.slice(0, 40)} className="mt-4 text-ink leading-relaxed">
                    {paragraph}
                  </p>
                ))}
                {content.offerNote && (
                  <p className="mt-5 rounded-xl border border-primary-100 bg-primary-50/80 px-4 py-3 text-sm leading-relaxed text-ink">
                    {content.offerNote}
                  </p>
                )}
              </Card>
            </div>

            <div className="lg:col-span-7">
              <OfferShowcase promoCard={promoCard} whatsappUrl={whatsappUrl} />
            </div>
          </div>

          {/* Row 2: features get their own full-width band — no empty card belly */}
          {content.features?.length > 0 && (
            <Card>
              <FeatureList
                title={content.featuresTitle}
                items={content.features}
                columns="sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              />
            </Card>
          )}

          {sections.map((section) => (
            <Card key={section.id}>
              <h2 className="font-display text-2xl font-bold text-heading">{section.title}</h2>
              {section.subtitle && (
                <p className="mt-2 text-lg font-semibold text-primary-600">{section.subtitle}</p>
              )}
              {section.lead && <p className="mt-4 text-ink">{section.lead}</p>}
              {section.reassure && (
                <p className="mt-2 font-semibold text-primary-600">{section.reassure}</p>
              )}
              {(section.body || []).map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-4 text-ink leading-relaxed">
                  {paragraph}
                </p>
              ))}
              {section.features?.length > 0 && (
                <div className="mt-6">
                  <FeatureList title={section.featuresTitle} items={section.features} />
                </div>
              )}
            </Card>
          ))}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
            <Button to="/pricing">{content.ctaDefault || 'Price Calculator'}</Button>
            {whatsappUrl && (
              <Button href={whatsappUrl} variant="outline">
                <MessageCircle className="mr-2 inline" size={18} />
                {content.whatsappCta}
              </Button>
            )}
            <Link to="/contact" className="text-sm font-medium text-primary-600 hover:underline">
              Contact Us
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
