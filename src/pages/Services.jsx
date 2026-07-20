import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useContent } from '../hooks/useContent'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import { DynamicIcon } from '../components/common/DynamicIcon'
import { HoverLift, useMotionSafe } from '../components/common/Motion'
import SmartImage from '../components/common/SmartImage'
import { pageImageUrl, mediaImageUrl } from '../utils/assets'

const EASE = [0.22, 1, 0.36, 1]

const panelVariants = {
  initial: { opacity: 1, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASE, when: 'beforeChildren', staggerChildren: 0.05 },
  },
  exit: { opacity: 1, y: -6, transition: { duration: 0.15, ease: EASE } },
}

const cardVariants = {
  initial: { opacity: 1, y: 10, scale: 1 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: EASE } },
}

export default function Services() {
  const { data: page, loading, error } = useContent('pages/services.json')
  const [activeTab, setActiveTab] = useState(0)

  return (
    <PageContentGate loading={loading} error={error}>
      <ServicesContent page={page} activeTab={activeTab} setActiveTab={setActiveTab} />
    </PageContentGate>
  )
}

function ServicesContent({ page, activeTab, setActiveTab }) {
  const animate = useMotionSafe()
  const content = page?.content || {}
  const tabs = content.tabs || []
  const tab = tabs[activeTab] || tabs[0]
  const advantages = content.advantages

  const heroSrc = tab?.heroImage
    ? mediaImageUrl(tab.heroImage)
    : pageImageUrl(content.hero?.image) || mediaImageUrl(content.hero?.image)

  return (
    <>
      <PageMeta meta={page?.meta} />
      <section className="relative overflow-hidden bg-dark py-20 text-white lg:py-28">
        <AnimatePresence mode="wait" initial={false}>
          {heroSrc && (
            <motion.img
              key={heroSrc}
              src={heroSrc}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
              decoding="async"
              fetchpriority="high"
              initial={animate ? { opacity: 0.4, scale: 1.02 } : false}
              animate={animate ? { opacity: 0.4, scale: 1 } : undefined}
              exit={animate ? { opacity: 0.4 } : undefined}
              transition={{ duration: 0.45, ease: EASE }}
            />
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-black/50" />
        <Container className="relative z-10 text-center">
          <h1 className="font-display text-4xl font-bold lg:text-5xl">{content.hero?.headline}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-neutral-200">{content.hero?.subheadline}</p>
        </Container>
      </section>

      {content.intro && (
        <section className="border-b border-neutral-200 bg-white py-12">
          <Container>
            <p className="mx-auto max-w-4xl text-center text-base leading-relaxed text-ink lg:text-lg">
              {content.intro}
            </p>
          </Container>
        </section>
      )}

      <section className="section-padding bg-primary-50">
        <Container>
          <div className="mb-8 flex flex-wrap gap-2 border-b border-neutral-200 pb-4" role="tablist" aria-label="Service categories">
            {tabs.map((t, i) => {
              const selected = i === activeTab
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`tabpanel-${t.id}`}
                  onClick={() => setActiveTab(i)}
                  className={`relative rounded-lg px-4 py-2 text-sm font-semibold ${
                    selected ? 'text-white' : 'bg-neutral-100 text-ink hover:bg-neutral-200'
                  }`}
                  whileHover={animate && !selected ? { scale: 1.03 } : undefined}
                  whileTap={animate ? { scale: 0.97 } : undefined}
                  transition={{ duration: 0.2 }}
                >
                  {selected && animate && (
                    <motion.span
                      layoutId="services-tab-pill"
                      className="absolute inset-0 rounded-lg bg-primary-500"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  {selected && !animate && (
                    <span className="absolute inset-0 rounded-lg bg-primary-500" />
                  )}
                  <span className="relative z-10">{t.label}</span>
                </motion.button>
              )
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab?.id || activeTab}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              role="tabpanel"
              id={`tabpanel-${tab?.id}`}
              aria-labelledby={`tab-${tab?.id}`}
              variants={animate ? panelVariants : undefined}
              initial={animate ? 'initial' : false}
              animate={animate ? 'animate' : undefined}
              exit={animate ? 'exit' : undefined}
            >
              {tab?.services?.map((service) => {
                const img = mediaImageUrl(service.image)
                return (
                  <motion.div key={service.title} variants={animate ? cardVariants : undefined}>
                    <HoverLift className="h-full">
                      <Card className="h-full overflow-hidden p-0">
                        {img ? (
                          <div className="h-40 overflow-hidden bg-primary-50">
                            <SmartImage
                              src={img}
                              alt={service.title}
                              className="h-full w-full object-cover"
                              wrapperClassName="h-full w-full"
                            />
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
                          <p className="mt-2 text-sm text-ink">{service.description}</p>
                        </div>
                      </Card>
                    </HoverLift>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>

          {advantages?.items?.length > 0 && (
            <div className="mt-16">
              <h2 className="mb-8 text-center font-display text-3xl font-bold text-heading">
                {advantages.title || 'Advantage of Our Services'}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {advantages.items.map((item) => (
                  <Card key={item.title} className="text-center">
                    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                      <DynamicIcon name={item.icon || 'Check'} size={24} />
                    </div>
                    <h3 className="font-display text-base font-semibold text-heading">{item.title}</h3>
                    <p className="mt-2 text-sm text-ink">{item.description}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {content.cta && (
            <div className="mt-16 rounded-2xl gradient-gold p-8 text-center text-white">
              <h2 className="font-display text-2xl font-bold text-white">{content.cta.title}</h2>
              <p className="mt-2 text-white/90">{content.cta.subtitle}</p>
              <Button
                to={content.cta.buttonLink || '/pricing'}
                className="mt-6 !border-0 !bg-white !text-primary-600 hover:!bg-neutral-100"
              >
                {content.cta.button}
              </Button>
            </div>
          )}
        </Container>
      </section>
    </>
  )
}
