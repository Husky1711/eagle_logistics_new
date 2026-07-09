import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
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
  const heroImg = pageImageUrl(content.hero?.image)

  return (
    <>
      <PageMeta meta={page?.meta} />
      <section className="relative overflow-hidden bg-dark py-20 text-white lg:py-28">
        {heroImg && (
          <img
            src={heroImg}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
            decoding="async"
            fetchpriority="high"
          />
        )}
        <div className="absolute inset-0 bg-black/55" />
        <Container className="relative z-10 text-center">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{content.hero?.title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-200">{content.hero?.subtitle}</p>
        </Container>
      </section>

      <section className="section-padding">
        <Container>
          <div className="mx-auto max-w-3xl space-y-8">
            {content.story?.map((section) => (
              <Card key={section.title}>
                <h2 className="font-display text-2xl font-semibold text-dark">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-neutral-600">{section.body}</p>
              </Card>
            ))}
          </div>

          {content.stats?.length > 0 && (
            <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {content.stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="font-display text-3xl font-bold text-primary-600">{stat.value}</p>
                  <p className="mt-1 text-sm text-neutral-600">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {content.cta && (
            <div className="mt-16 text-center">
              <h2 className="font-display text-2xl font-bold">{content.cta.title}</h2>
              <p className="mt-2 text-neutral-600">{content.cta.subtitle}</p>
              <Button to={content.cta.buttonLink || '/pricing'} className="mt-6">
                {content.cta.button}
              </Button>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
