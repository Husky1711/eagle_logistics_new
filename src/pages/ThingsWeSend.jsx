import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import { FadeIn, Stagger, StaggerItem } from '../components/common/Motion'
import SmartImage from '../components/common/SmartImage'
import { assetUrl } from '../utils/assets'
import { buildWhatsAppUrl } from '../utils/whatsapp'

function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return assetUrl(`assets/${path.replace(/^assets\//, '')}`)
}

export default function ThingsWeSend() {
  const { data: page, loading, error } = useContent('pages/things-we-send.json')

  return (
    <PageContentGate loading={loading} error={error}>
      <ThingsWeSendHub page={page} />
    </PageContentGate>
  )
}

export function ThingsWeSendItem() {
  const { slug } = useParams()
  const { data: page, loading, error } = useContent('pages/things-we-send.json')

  return (
    <PageContentGate loading={loading} error={error}>
      <ThingsWeSendDetail page={page} slug={slug} />
    </PageContentGate>
  )
}

function ThingsWeSendHub({ page }) {
  const content = page?.content || {}
  const items = content.items || []
  const heroSrc = mediaUrl(content.heroImage)

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
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <Container className="relative z-10 py-20 text-center lg:py-28">
          <FadeIn>
            <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">{content.title}</h1>
            {content.headline && (
              <p className="mx-auto mt-4 max-w-3xl text-lg text-neutral-200 lg:text-xl">{content.headline}</p>
            )}
          </FadeIn>
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container>
          <h2 className="mb-8 font-display text-2xl font-bold text-heading lg:text-3xl">
            {content.catalogTitle || 'What we ship'}
          </h2>
          <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => {
              const img = mediaUrl(item.image)
              return (
                <StaggerItem key={item.id}>
                  <Link
                    to={`/things-we-send/${item.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft transition-shadow hover:shadow-medium"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      {img && (
                        <SmartImage
                          src={img}
                          alt={item.title}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          wrapperClassName="h-full w-full"
                        />
                      )}
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-xl font-semibold text-heading">{item.title}</h3>
                      <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink">
                        {item.summary}
                      </p>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600">
                        {content.viewLabel || 'View details'}
                        <ArrowRight
                          className="ml-1 transition-transform group-hover:translate-x-1"
                          size={16}
                          aria-hidden
                        />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              )
            })}
          </Stagger>
        </Container>
      </section>
    </>
  )
}

function ThingsWeSendDetail({ page, slug }) {
  const { settings } = useSettings()
  const content = page?.content || {}
  const items = content.items || []
  const item = items.find((entry) => entry.slug === slug)

  if (!item) {
    return <Navigate to="/things-we-send" replace />
  }

  const heroSrc = mediaUrl(item.bannerImage || item.image)
  const whatsappUrl = buildWhatsAppUrl(
    settings?.contact?.whatsapp,
    `Hi Eagle Logistics, I want to ship ${item.title}.`,
  )
  const idx = items.findIndex((entry) => entry.slug === slug)
  const prev = items[(idx - 1 + items.length) % items.length]
  const next = items[(idx + 1) % items.length]

  return (
    <>
      <PageMeta
        meta={{
          ...(page?.meta || {}),
          ...(item.meta || {}),
        }}
      />

      <section className="relative overflow-hidden bg-dark text-white">
        {heroSrc && (
          <SmartImage
            src={heroSrc}
            alt=""
            fill
            loading="eager"
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-primary-900/35" />
        <Container className="relative z-10 py-16 lg:py-24">
          <Link
            to="/things-we-send"
            className="inline-flex items-center text-sm font-medium text-neutral-200 hover:text-white"
          >
            <ArrowLeft className="mr-1" size={16} aria-hidden />
            Things We Send
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold text-white lg:text-5xl">{item.title}</h1>
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container>
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-primary-50 shadow-soft">
              <SmartImage
                src={mediaUrl(item.image)}
                alt={item.title}
                className="aspect-[4/3] w-full object-cover"
                wrapperClassName="aspect-[4/3] w-full"
                loading="eager"
              />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
                Things We Send
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold text-heading">{item.title}</h2>
              <div className="mt-4 h-1 w-14 rounded-full bg-primary-500" />
              <div className="mt-6 space-y-4">
                {(item.body || []).map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="leading-relaxed text-ink">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button to="/pricing">{content.ctaDefault || 'Price Calculator'}</Button>
                {whatsappUrl && (
                  <Button href={whatsappUrl} variant="outline">
                    <MessageCircle className="mr-2 inline" size={18} />
                    {content.whatsappCta || 'Ask on WhatsApp'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-8">
            <Link
              to={`/things-we-send/${prev.slug}`}
              className="inline-flex items-center text-sm font-semibold text-ink hover:text-primary-600"
            >
              <ArrowLeft className="mr-1" size={16} aria-hidden />
              {prev.title}
            </Link>
            <Link
              to="/things-we-send"
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              All items
            </Link>
            <Link
              to={`/things-we-send/${next.slug}`}
              className="inline-flex items-center text-sm font-semibold text-ink hover:text-primary-600"
            >
              {next.title}
              <ArrowRight className="ml-1" size={16} aria-hidden />
            </Link>
          </div>
        </Container>
      </section>
    </>
  )
}
