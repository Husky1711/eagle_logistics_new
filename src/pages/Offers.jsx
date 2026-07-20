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

function FeatureList({ title, items }) {
  if (!items?.length) return null
  return (
    <div className="mt-6">
      <h3 className="font-display text-lg font-semibold text-heading">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-ink">
            <Check className="mt-0.5 shrink-0 text-primary-500" size={16} aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PromoRateCard({ promoCard }) {
  if (!promoCard) return null
  const imageSrc = pageImageUrl(promoCard.image)

  return (
    <aside className="overflow-hidden rounded-xl border border-neutral-200 shadow-soft lg:sticky lg:top-24">
      <div className="bg-[#FFCC00] px-4 py-5 text-center text-[#1A3668]">
        {promoCard.line1 && (
          <p className="text-base font-extrabold leading-snug sm:text-lg">{promoCard.line1}</p>
        )}
        {promoCard.line2 && (
          <p className="mt-1 text-xl font-extrabold leading-tight sm:text-2xl">{promoCard.line2}</p>
        )}
      </div>

      <div className="relative min-h-[340px] overflow-hidden bg-[#A9C9E0]">
        {imageSrc && (
          <SmartImage
            src={imageSrc}
            alt=""
            fill
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[center_70%] opacity-95"
            style={{ clipPath: 'inset(18% 0 0 0)' }}
          />
        )}
        <div className="relative z-10 flex min-h-[340px] flex-col justify-between p-5">
          {promoCard.items?.length > 0 && (
            <ul className="space-y-1.5 text-sm font-semibold text-[#1A4A7A] drop-shadow-sm">
              {promoCard.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {promoCard.disclaimer && (
            <p className="self-end text-[10px] text-white/90">{promoCard.disclaimer}</p>
          )}
        </div>
      </div>
    </aside>
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
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
        <Container className="relative z-10 py-20 text-center lg:py-28">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{content.title}</h1>
          {content.headline && (
            <p className="mx-auto mt-4 max-w-3xl text-lg text-white lg:text-xl">{content.headline}</p>
          )}
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container className="space-y-10">
          {promoActive && offers?.title && (
            <Card className="border-gold-500 ring-1 ring-gold-400">
              <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-0.5 text-xs font-bold text-white">
                <Tag size={12} /> {content.currentPromoLabel || 'Current promo'}
              </span>
              <h2 className="font-display text-2xl font-semibold text-heading">{offers.title}</h2>
              {offers.subtitle && <p className="mt-2 text-ink">{offers.subtitle}</p>}
              {offers.code && (
                <p className="mt-4 rounded-lg bg-neutral-100 px-3 py-2 font-mono text-sm font-semibold text-primary-700">
                  Use code: {offers.code}
                </p>
              )}
            </Card>
          )}

          <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              {content.lead && <p className="text-base text-ink">{content.lead}</p>}
              {content.reassure && (
                <p className="mt-3 text-base font-semibold text-primary-600">{content.reassure}</p>
              )}
              {(content.body || []).map((paragraph) => (
                <p key={paragraph.slice(0, 40)} className="mt-4 text-ink leading-relaxed">
                  {paragraph}
                </p>
              ))}
              <FeatureList title={content.featuresTitle} items={content.features} />
              {content.offerNote && (
                <p className="mt-6 rounded-lg bg-primary-50 p-4 text-sm text-ink leading-relaxed">
                  {content.offerNote}
                </p>
              )}
            </Card>

            <PromoRateCard promoCard={promoCard} />
          </div>

          {sections.map((section) => (
            <Card key={section.id}>
              <h2 className="font-display text-2xl font-bold text-heading">{section.title}</h2>
              {section.subtitle && (
                <p className="mt-2 text-lg font-semibold text-gold-600">{section.subtitle}</p>
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
              <FeatureList title={section.featuresTitle} items={section.features} />
            </Card>
          ))}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
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
