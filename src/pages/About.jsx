import { Eye, Target, ArrowRight } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import { DynamicIcon } from '../components/common/DynamicIcon'
import { FadeIn, Stagger, StaggerItem } from '../components/common/Motion'
import SmartImage from '../components/common/SmartImage'
import { pageImageUrl } from '../utils/assets'

export default function About() {
  const { data: page, loading, error } = useContent('pages/about.json')

  return (
    <PageContentGate loading={loading} error={error}>
      <AboutContent page={page} />
    </PageContentGate>
  )
}

function AboutContent({ page }) {
  const content = page?.content || {}
  const about = content.about || {}
  const vision = content.vision
  const mission = content.mission
  const values = content.values
  const heroImg = pageImageUrl(content.hero?.image)

  return (
    <>
      <PageMeta meta={page?.meta} />

      <section className="relative overflow-hidden bg-dark text-white">
        {heroImg && (
          <SmartImage
            src={heroImg}
            alt=""
            fill
            loading="eager"
            fetchpriority="high"
            className="absolute inset-0 h-full w-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-br from-black/90 via-black/70 to-primary-900/50" />
        <Container className="relative z-10 py-20 text-center lg:py-28">
          <FadeIn>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">
              Eagle Logistics & Express Services
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold text-white lg:text-6xl">{content.hero?.title}</h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-neutral-200">{content.hero?.subtitle}</p>
          </FadeIn>
        </Container>
      </section>

      {about.title && (
        <section className="section-padding bg-white">
          <Container>
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
              <div>
                {about.eyebrow && (
                  <span className="inline-flex rounded-md bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-700">
                    {about.eyebrow}
                  </span>
                )}
                <h2 className="mt-4 font-display text-3xl font-bold text-heading lg:text-4xl">{about.title}</h2>
                <div className="mt-5 h-1 w-16 rounded-full bg-primary-500" />
              </div>
              <p className="text-base leading-relaxed text-ink lg:text-lg">{about.lead}</p>
            </div>

            {about.highlights?.length > 0 && (
              <Stagger className="mt-14 grid gap-6 md:grid-cols-3">
                {about.highlights.map((item, i) => (
                  <StaggerItem key={item.title}>
                    <article className="group relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-6 transition-shadow hover:shadow-medium">
                      <span className="pointer-events-none absolute -right-2 -top-3 font-display text-6xl font-bold text-primary-100 transition-colors group-hover:text-primary-200">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="relative">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-soft">
                          <DynamicIcon name={item.icon} size={22} />
                        </div>
                        <h3 className="font-display text-xl font-semibold text-heading">{item.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-ink">{item.body}</p>
                      </div>
                    </article>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </Container>
        </section>
      )}

      {(vision || mission) && (
        <section className="section-padding bg-primary-50">
          <Container>
            <div className="grid gap-6 lg:grid-cols-2">
              {vision && (
                <article className="flex h-full flex-col rounded-2xl bg-dark p-8 text-white shadow-medium lg:p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-white">
                    <Eye size={28} aria-hidden />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white lg:text-3xl">{vision.title}</h2>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-neutral-300">{vision.body}</p>
                </article>
              )}
              {mission && (
                <article className="flex h-full flex-col rounded-2xl border border-primary-200 bg-white p-8 shadow-soft lg:p-10">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
                    <Target size={28} aria-hidden />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-heading lg:text-3xl">{mission.title}</h2>
                  <p className="mt-4 flex-1 text-base leading-relaxed text-ink">{mission.body}</p>
                </article>
              )}
            </div>
          </Container>
        </section>
      )}

      {values && (
        <section className="section-padding relative overflow-hidden bg-gradient-to-br from-[#1a2744] via-[#243556] to-[#1a2744] text-white">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,rgba(249,115,22,0.35),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(251,191,36,0.2),transparent_35%)]" />
          <Container className="relative z-10">
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-16">
              <div>
                <h2 className="font-display text-3xl font-bold text-white lg:text-4xl">{values.title}</h2>
                <div className="mt-4 h-1 w-16 rounded-full bg-primary-500" />
                <p className="mt-6 text-base leading-relaxed text-neutral-300">{values.body}</p>
              </div>
              {values.items?.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {values.items.map((item, i) => (
                    <li
                      key={item}
                      className={`rounded-xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur-sm transition-colors hover:border-primary-400/50 hover:bg-white/10 ${
                        i === values.items.length - 1 && values.items.length % 2 === 1 ? 'sm:col-span-2' : ''
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest text-primary-400">
                        0{i + 1}
                      </span>
                      <p className="mt-1 font-display text-lg font-semibold text-white">{item}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Container>
        </section>
      )}

      {content.cta && (
        <section className="section-padding bg-white">
          <Container>
            <div className="mx-auto max-w-3xl rounded-2xl border border-primary-100 bg-primary-50 px-6 py-12 text-center shadow-soft lg:px-12">
              <h2 className="font-display text-2xl font-bold text-heading lg:text-3xl">{content.cta.title}</h2>
              <p className="mt-3 text-ink">{content.cta.subtitle}</p>
              <Button to={content.cta.buttonLink || '/pricing'} className="mt-8 group">
                {content.cta.button}
                <ArrowRight className="ml-2 inline transition-transform group-hover:translate-x-1" size={18} />
              </Button>
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
