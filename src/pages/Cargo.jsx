import { Link, useParams, Navigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import SmartImage from '../components/common/SmartImage'
import { assetUrl } from '../utils/assets'

function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return assetUrl(`assets/${path.replace(/^assets\//, '')}`)
}

export default function Cargo() {
  const { slug } = useParams()
  const { data: page, loading, error } = useContent('pages/cargo.json')

  return (
    <PageContentGate loading={loading} error={error}>
      <CargoDetail page={page} slug={slug} />
    </PageContentGate>
  )
}

function CargoDetail({ page, slug }) {
  const items = page?.content?.items || []
  const item = items.find((entry) => entry.slug === slug)

  if (!item) {
    return <Navigate to="/" replace />
  }

  const idx = items.findIndex((entry) => entry.slug === slug)
  const prev = items[(idx - 1 + items.length) % items.length]
  const next = items[(idx + 1) % items.length]

  return (
    <>
      <PageMeta meta={{ ...(page?.meta || {}), ...(item.meta || {}) }} />

      <section className="relative overflow-hidden bg-dark text-white">
        <SmartImage
          src={mediaUrl(item.image)}
          alt=""
          fill
          loading="eager"
          fetchpriority="high"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/55 to-primary-900/35" />
        <Container className="relative z-10 py-16 lg:py-24">
          <Link to="/" className="inline-flex items-center text-sm font-medium text-neutral-200 hover:text-white">
            <ArrowLeft className="mr-1" size={16} aria-hidden />
            Home
          </Link>
          <h1 className="mt-4 font-display text-4xl font-bold text-white lg:text-5xl">{item.title}</h1>
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container>
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4">
              {(item.body || []).map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="leading-relaxed text-ink">
                  {paragraph}
                </p>
              ))}
            </div>

            {item.bullets?.length > 0 && (
              <ul className="mt-8 space-y-3">
                {item.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-ink">
                    <Check className="mt-0.5 shrink-0 text-primary-500" size={18} aria-hidden />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-10">
              <Button to="/pricing">Price Calculator</Button>
            </div>
          </div>

          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-8">
            <Link
              to={`/cargo/${prev.slug}`}
              className="inline-flex items-center text-sm font-semibold text-ink hover:text-primary-600"
            >
              <ArrowLeft className="mr-1" size={16} aria-hidden />
              {prev.title}
            </Link>
            <Link to="/services" className="text-sm font-medium text-primary-600 hover:underline">
              All services
            </Link>
            <Link
              to={`/cargo/${next.slug}`}
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
