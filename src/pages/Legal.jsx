import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import LoadingSpinner from '../components/common/LoadingSpinner'

function LegalPage({ path, fallbackTitle }) {
  const { data: page, loading } = useContent(path)
  if (loading) return <LoadingSpinner />

  const content = page?.content || {}
  return (
    <>
      <PageMeta meta={page?.meta} />
      <section className="section-padding">
        <Container className="max-w-3xl">
          <h1 className="font-display text-4xl font-bold text-dark">{content.title || fallbackTitle}</h1>
          {content.lastUpdated && (
            <p className="mt-2 text-sm text-neutral-500">Last updated: {content.lastUpdated}</p>
          )}
          <div className="mt-10 space-y-8">
            {content.sections?.map((section) => (
              <article key={section.title}>
                <h2 className="font-display text-xl font-semibold text-dark">{section.title}</h2>
                <p className="mt-3 leading-relaxed text-neutral-600">{section.body}</p>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  )
}

export function Privacy() {
  return <LegalPage path="pages/privacy.json" fallbackTitle="Privacy Policy" />
}

export function Terms() {
  return <LegalPage path="pages/terms.json" fallbackTitle="Terms of Service" />
}
