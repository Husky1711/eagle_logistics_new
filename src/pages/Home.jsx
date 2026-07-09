import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import LoadingSpinner from '../components/common/LoadingSpinner'
import HeroCarousel from '../components/public/HeroCarousel'
import { DynamicIcon } from '../components/common/DynamicIcon'
import { heroImageUrl, courierLogoUrl } from '../utils/assets'

function CourierCard({ courier }) {
  const logo = courierLogoUrl(courier.logo)
  return (
    <Card className="flex h-full flex-col items-center justify-center text-center transition-shadow hover:shadow-medium">
      <div className="mb-3 flex h-24 w-full items-center justify-center rounded-lg bg-neutral-50 p-4">
        {logo ? (
          <img src={logo} alt={courier.name} className="max-h-20 max-w-full object-contain" loading="lazy" />
        ) : (
          <span className="font-display text-lg font-bold text-primary-600">{courier.name.slice(0, 2)}</span>
        )}
      </div>
      <p className="text-sm font-medium text-neutral-700">{courier.name}</p>
    </Card>
  )
}

export default function Home() {
  const { data: page, loading: pageLoading, error: pageError } = useContent('pages/home.json')
  const { data: couriers, loading: couriersLoading } = useContent('couriers.json')

  if (pageLoading || couriersLoading) return <LoadingSpinner />
  if (pageError) {
    return (
      <Container className="py-20 text-center text-red-600">
        Failed to load page content: {pageError}
      </Container>
    )
  }

  const content = page?.content || {}
  const hero = content.hero || {}
  const slides = (content.heroImages || []).map((file, i) => ({
    url: heroImageUrl(file),
    alt: `Eagle Logistics hero ${i + 1}`,
  }))

  const activeCouriers = (couriers || []).filter((c) => c.active).sort((a, b) => a.display_order - b.display_order)

  return (
    <>
      <PageMeta meta={page.meta} />

      {/* Hero */}
      <section className="relative min-h-[560px] lg:min-h-[640px]">
        <div className="absolute inset-0">
          <HeroCarousel images={slides} />
        </div>
        <Container className="relative z-10 flex min-h-[560px] items-center py-20 lg:min-h-[640px]">
          <div className="max-w-2xl text-white">
            <h1 className="font-display text-4xl font-bold leading-tight drop-shadow-lg sm:text-5xl lg:text-6xl">
              {hero.headline}
            </h1>
            <p className="mt-6 text-lg text-neutral-100 drop-shadow-md sm:text-xl">{hero.subheadline}</p>
            <div className="mt-8">
              <Button to={hero.ctaLink || '/pricing'} className="group">
                {hero.cta || 'Calculate Shipping Cost'}
                <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={20} />
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      {content.howItWorks?.enabled && (
        <section className="section-padding bg-neutral-50">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold text-dark lg:text-4xl">{content.howItWorks.title}</h2>
              <p className="mt-3 text-neutral-600">{content.howItWorks.subtitle}</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {content.howItWorks.steps?.map((step) => (
                <Card key={step.id} className="text-center">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                    <DynamicIcon name={step.icon} size={28} />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-neutral-600">{step.description}</p>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Courier partners */}
      {content.courierPartners?.enabled && activeCouriers.length > 0 && (
        <section className="section-padding">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold text-dark">{content.courierPartners.title}</h2>
              <p className="mt-3 text-neutral-600">{content.courierPartners.subtitle}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {activeCouriers.map((courier) => (
                <CourierCard key={courier.id} courier={courier} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Why choose us */}
      {content.whyChooseUs?.enabled && (
        <section className="section-padding bg-dark text-white">
          <Container>
            <div className="mb-12 text-center">
              <h2 className="font-display text-3xl font-bold">{content.whyChooseUs.title}</h2>
              <p className="mt-3 text-neutral-300">{content.whyChooseUs.subtitle}</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {content.whyChooseUs.features?.map((f) => (
                <div key={f.id} className="rounded-2xl border border-neutral-700 bg-neutral-800/50 p-6">
                  <div className="mb-4 text-gold-400">
                    <DynamicIcon name={f.icon} size={32} />
                  </div>
                  <h3 className="font-display text-xl font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-neutral-300">{f.description}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* CTA */}
      {content.cta && (
        <section className="section-padding gradient-gold text-white">
          <Container className="text-center">
            <h2 className="font-display text-3xl font-bold">{content.cta.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-white/90">{content.cta.subtitle}</p>
            <Button to={content.cta.buttonLink || '/pricing'} variant="outline" className="mt-8 !border-white !text-white hover:!bg-white/10">
              {content.cta.button || 'Get Started'}
            </Button>
          </Container>
        </section>
      )}
    </>
  )
}
