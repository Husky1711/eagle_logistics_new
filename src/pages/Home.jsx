import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import HeroCarousel from '../components/public/HeroCarousel'
import { DynamicIcon } from '../components/common/DynamicIcon'
import { FadeIn, Stagger, StaggerItem, SlideDown } from '../components/common/Motion'
import SmartImage from '../components/common/SmartImage'
import { assetUrl, heroImageUrl } from '../utils/assets'
import { useReducedMotion } from '../hooks/useReducedMotion'

function mediaUrl(path) {
  if (!path) return null
  if (path.startsWith('http')) return path
  if (path.includes('/')) return assetUrl(`assets/${path.replace(/^assets\//, '')}`)
  return heroImageUrl(path)
}

export default function Home() {
  const reducedMotion = useReducedMotion()
  const { data: page, loading, error } = useContent('pages/home.json')

  return (
    <PageContentGate loading={loading} error={error}>
      <HomeContent page={page} reducedMotion={reducedMotion} />
    </PageContentGate>
  )
}

function HomeContent({ page, reducedMotion }) {
  const content = page?.content || {}
  const hero = content.hero || {}
  const slides = (content.heroImages || []).map((file, i) => ({
    url: mediaUrl(file),
    alt: `Eagle Logistics hero ${i + 1}`,
  }))

  return (
    <>
      <PageMeta meta={page.meta} />

      <section className="relative min-h-[480px] lg:min-h-[560px]">
        <div className="absolute inset-0">
          <HeroCarousel images={slides} reducedMotion={reducedMotion} />
        </div>
        <div className="absolute inset-0 z-10 flex items-center">
          <Container className="relative pb-16 pt-8 sm:pb-20">
            <FadeIn className="max-w-2xl text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary-200">
                {hero.brand || 'Eagle Logistics'}
              </p>
              <h1 className="mt-3 font-display text-3xl font-bold text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
                {hero.headline || content.intro?.title || 'Eagle Logistics & Express Services'}
              </h1>
              {(hero.subheadline || content.intro?.body) && (
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
                  {hero.subheadline ||
                    'Trusted courier and cargo from Bangalore to destinations across India and the world.'}
                </p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button to={hero.ctaLink || '/pricing'} className="group">
                  {hero.cta || 'Price Calculator'}
                  <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={18} />
                </Button>
                <Button to="/tracking" variant="outline" className="!border-white !text-white hover:!bg-white/10">
                  Track Shipment
                </Button>
              </div>
            </FadeIn>
          </Container>
        </div>
        {hero.promo && (
          <SlideDown className="absolute inset-x-0 bottom-0 z-20 bg-[#0b243d]/90 px-4 py-3 text-center text-sm font-medium text-white sm:text-base">
            {hero.promo}
          </SlideDown>
        )}
      </section>

      {content.intro && (
        <section className="section-padding bg-white">
          <Container>
            <FadeIn className="mx-auto max-w-3xl">
              <h2 className="font-display text-2xl font-bold text-heading lg:text-3xl">
                {content.intro.sectionTitle || 'Why ship with Eagle'}
              </h2>
              <p className="mt-5 text-base leading-relaxed text-ink lg:text-lg">{content.intro.body}</p>
              <Link
                to={content.intro.readMoreLink || '/about'}
                className="mt-6 inline-flex items-center font-semibold text-primary-600 hover:underline"
              >
                {content.intro.readMoreLabel || 'Read More'}
                <ArrowRight className="ml-1" size={16} aria-hidden />
              </Link>
            </FadeIn>
          </Container>
        </section>
      )}

      {content.mission && (
        <section className="section-padding bg-primary-50">
          <Container>
            <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
              <FadeIn>
                <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-primary-50 shadow-soft">
                  <SmartImage
                    src={mediaUrl(content.mission.image)}
                    alt={content.mission.imageAlt || 'Eagle Logistics parcel and logistics operations'}
                    className="aspect-[4/3] w-full object-cover"
                    wrapperClassName="aspect-[4/3] w-full"
                  />
                </div>
              </FadeIn>
              <FadeIn delay={0.12}>
                <h2 className="font-display text-3xl font-bold text-heading">{content.mission.title}</h2>
                <div className="mt-4 h-1 w-14 rounded-full bg-primary-500" />
                <Stagger className="mt-6 space-y-3" delay={0.1}>
                  {content.mission.items?.map((item) => (
                    <StaggerItem key={item}>
                      <div className="flex items-start gap-3 text-ink">
                        <Check className="mt-0.5 shrink-0 text-primary-500" size={18} aria-hidden />
                        <span>{item}</span>
                      </div>
                    </StaggerItem>
                  ))}
                </Stagger>
              </FadeIn>
            </div>
          </Container>
        </section>
      )}

      {content.serviceCards?.length > 0 && (
        <section className="section-padding bg-white">
          <Container>
            <Stagger className="grid gap-6 md:grid-cols-2">
              {content.serviceCards.map((card) => (
                <StaggerItem key={card.id}>
                  <article className="h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft transition-shadow hover:shadow-medium">
                    <SmartImage
                      src={mediaUrl(card.image)}
                      alt={card.title}
                      className="aspect-[16/9] w-full object-cover"
                      wrapperClassName="aspect-[16/9] w-full"
                    />
                    <div className="p-6">
                      <h3 className="font-display text-2xl font-semibold text-heading">{card.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-ink">{card.body}</p>
                      <Link
                        to={card.link || '/services'}
                        className="mt-4 inline-flex items-center text-sm font-semibold text-primary-600 hover:underline"
                      >
                        {card.linkLabel || 'Read More'}
                        <ArrowRight className="ml-1" size={14} aria-hidden />
                      </Link>
                    </div>
                  </article>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {content.advantages && (
        <section className="section-padding bg-primary-50">
          <Container>
            <FadeIn>
              <h2 className="text-center font-display text-3xl font-bold text-heading lg:text-4xl">
                {content.advantages.title}
              </h2>
            </FadeIn>
            <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" delay={0.05}>
              {content.advantages.items?.map((item) => (
                <StaggerItem key={item.id}>
                  <Link
                    to={item.link || '/services'}
                    className="flex h-full items-start gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-soft transition-shadow hover:shadow-medium"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                      {item.iconImage ? (
                        <SmartImage
                          src={mediaUrl(item.iconImage)}
                          alt=""
                          className="h-8 w-8 object-contain"
                          wrapperClassName="h-8 w-8 bg-transparent"
                        />
                      ) : (
                        <DynamicIcon name={item.icon} size={22} />
                      )}
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-heading-link">{item.text}</p>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {content.popularItems && (
        <section className="section-padding bg-white">
          <Container>
            <FadeIn className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-display text-3xl font-bold text-heading lg:text-4xl">
                {content.popularItems.title}
              </h2>
              <Link
                to={content.popularItems.viewAllLink || '/things-we-send'}
                className="inline-flex items-center font-semibold text-primary-600 hover:underline"
              >
                {content.popularItems.viewAllLabel || 'View All'}
                <ArrowRight className="ml-1" size={16} aria-hidden />
              </Link>
            </FadeIn>
            <Stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" stagger={0.06}>
              {content.popularItems.items?.map((item) => (
                <StaggerItem key={item.id}>
                  <Link
                    to={`/things-we-send/${item.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 shadow-soft transition-shadow hover:shadow-medium"
                  >
                    <div className="aspect-square overflow-hidden bg-primary-50">
                      <SmartImage
                        src={mediaUrl(item.image)}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        wrapperClassName="h-full w-full"
                      />
                    </div>
                    <p className="p-3 text-center text-sm font-semibold text-ink">{item.title}</p>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {content.testimonials && (
        <section className="section-padding bg-dark text-white">
          <Container>
            <FadeIn>
              <h2 className="text-center font-display text-3xl font-bold text-white lg:text-4xl">
                {content.testimonials.title}
              </h2>
            </FadeIn>
            <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
              {content.testimonials.items?.map((t) => (
                <StaggerItem key={t.id}>
                  <blockquote className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                    <p className="text-sm leading-relaxed text-neutral-200">&ldquo;{t.quote}&rdquo;</p>
                    <footer className="mt-4 text-sm font-semibold text-primary-300">
                      {t.name}
                      {t.location ? `, ${t.location}` : ''}
                    </footer>
                  </blockquote>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {content.cargo && (
        <section className="section-padding bg-primary-50">
          <Container>
            <FadeIn>
              <h2 className="text-center font-display text-3xl font-bold text-heading lg:text-4xl">
                {content.cargo.title}
              </h2>
            </FadeIn>
            <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
              {content.cargo.items?.map((item) => (
                <StaggerItem key={item.id}>
                  <Link
                    to={`/cargo/${item.slug}`}
                    className="group block h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-soft transition-shadow hover:shadow-medium"
                  >
                    <SmartImage
                      src={mediaUrl(item.image)}
                      alt={item.title}
                      className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      wrapperClassName="aspect-[16/10] w-full"
                    />
                    <div className="p-5">
                      <h3 className="font-display text-xl font-semibold text-heading">{item.title}</h3>
                      <p className="mt-2 text-sm text-ink">{item.summary}</p>
                      <span className="mt-3 inline-flex items-center text-sm font-semibold text-primary-600">
                        Read More
                        <ArrowRight className="ml-1 transition-transform group-hover:translate-x-1" size={14} />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        </section>
      )}

      {content.cta && (
        <section className="section-padding bg-white">
          <Container>
            <FadeIn className="rounded-2xl border border-primary-100 bg-primary-50 px-6 py-12 text-center shadow-soft lg:px-12">
              <h2 className="font-display text-2xl font-bold text-heading lg:text-3xl">{content.cta.title}</h2>
              <p className="mt-3 text-ink">{content.cta.subtitle}</p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button to={content.cta.buttonLink || '/pricing'} className="group">
                  {content.cta.button}
                  <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={18} />
                </Button>
                {content.cta.secondaryButton && content.cta.secondaryButtonLink && (
                  <Button to={content.cta.secondaryButtonLink} variant="outline">
                    {content.cta.secondaryButton}
                  </Button>
                )}
              </div>
            </FadeIn>
          </Container>
        </section>
      )}
    </>
  )
}
