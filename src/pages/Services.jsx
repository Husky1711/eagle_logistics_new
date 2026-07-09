import { useState } from 'react'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { DynamicIcon } from '../components/common/DynamicIcon'
import { pageImageUrl, heroImageUrl } from '../utils/assets'

export default function Services() {
  const { data: page, loading } = useContent('pages/services.json')
  const [activeTab, setActiveTab] = useState(0)

  if (loading) return <LoadingSpinner />

  const content = page?.content || {}
  const tabs = content.tabs || []
  const tab = tabs[activeTab] || tabs[0]

  const heroSrc = tab?.heroImage
    ? heroImageUrl(tab.heroImage) || pageImageUrl(tab.heroImage)
    : pageImageUrl(content.hero?.image)

  return (
    <>
      <PageMeta meta={page?.meta} />
      <section className="relative overflow-hidden bg-dark py-20 text-white lg:py-28">
        {heroSrc && (
          <img src={heroSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative z-10 text-center">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{content.hero?.headline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-200">{content.hero?.subheadline}</p>
        </Container>
      </section>

      <section className="section-padding">
        <Container>
          <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-4">
            {tabs.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  i === activeTab
                    ? 'bg-primary-500 text-white'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tab?.services?.map((service) => {
              const img = service.image
                ? heroImageUrl(service.image) || pageImageUrl(service.image)
                : null
              return (
                <Card key={service.title} className="overflow-hidden p-0">
                  {img ? (
                    <div className="h-40 overflow-hidden">
                      <img src={img} alt={service.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-primary-50 text-primary-600">
                      <DynamicIcon name={service.icon || 'Package'} size={40} />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gold-600">
                      {service.highlight}
                    </span>
                    <h3 className="mt-2 font-display text-xl font-semibold">{service.title}</h3>
                    <p className="mt-2 text-sm text-neutral-600">{service.description}</p>
                  </div>
                </Card>
              )
            })}
          </div>

          {content.cta && (
            <div className="mt-16 rounded-2xl gradient-gold p-8 text-center text-white">
              <h2 className="font-display text-2xl font-bold">{content.cta.title}</h2>
              <p className="mt-2 text-white/90">{content.cta.subtitle}</p>
              <Button to={content.cta.buttonLink || '/pricing'} variant="outline" className="mt-6 !border-white !text-white">
                {content.cta.button}
              </Button>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
