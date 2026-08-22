import { Mail, MapPin, Phone, MessageCircle, Globe } from 'lucide-react'
import { useContent, combineContentStates } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import SmartImage from '../components/common/SmartImage'
import FeedbackForm from '../components/contact/FeedbackForm'
import { FadeIn, Stagger, StaggerItem } from '../components/common/Motion'
import { buildWhatsAppUrl } from '../utils/whatsapp'
import { pageImageUrl } from '../utils/assets'

export default function Contact() {
  const pageState = useContent('pages/contact.json')
  const { settings } = useSettings()
  const { loading: pageLoading, error } = combineContentStates(pageState)
  const { data: page } = pageState

  return (
    <PageContentGate loading={pageLoading} error={error}>
      <ContactContent page={page} contact={settings?.contact || {}} />
    </PageContentGate>
  )
}

function DetailRow({ icon: Icon, title, children }) {
  return (
    <div className="flex gap-3 border-b border-neutral-100 py-4 last:border-b-0 last:pb-0 first:pt-0">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{title}</p>
        <div className="mt-1 text-sm leading-relaxed text-ink">{children}</div>
      </div>
    </div>
  )
}

function ContactContent({ page, contact }) {
  const content = page?.content || {}
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, 'Hi Eagle Logistics, I have a shipping inquiry.')
  const phones = [contact.phone, contact.phoneSecondary].filter(Boolean)
  const websiteHref = contact.website
    ? contact.website.startsWith('http')
      ? contact.website
      : `https://${contact.website}`
    : null
  const websiteLabel = contact.website?.replace(/^https?:\/\//, '') || ''
  const heroSrc = pageImageUrl(content.heroImage)

  const feedbackCopy = {
    nameLabel: content.feedbackNameLabel,
    emailLabel: content.feedbackEmailLabel,
    phoneLabel: content.feedbackPhoneLabel,
    topicLabel: content.feedbackTopicLabel,
    messageLabel: content.feedbackMessageLabel,
    messagePlaceholder: content.feedbackMessagePlaceholder,
    submitLabel: content.feedbackSubmit,
    helper: content.feedbackHelper,
    successTitle: content.feedbackSuccessTitle,
    successBody: content.feedbackSuccessBody,
    sendAnother: content.feedbackSendAnother,
  }

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
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/40 to-black/25" />
        <Container className="relative z-10 py-16 text-center lg:py-20">
          <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">{content.title}</h1>
          {content.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/95">{content.subtitle}</p>
          )}
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container className="space-y-8">
          {whatsappUrl && (
            <FadeIn className="lg:hidden" delay={0.05}>
              <Button href={whatsappUrl} className="w-full">
                <MessageCircle className="mr-2 inline" size={20} />
                {content.whatsappCta || 'Chat on WhatsApp'}
              </Button>
            </FadeIn>
          )}

          <Stagger className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
            <StaggerItem>
              <Card className="h-full !p-5 sm:!p-6">
                <DetailRow icon={MapPin} title={content.addressLabel || 'Address'}>
                  {contact.companyName && (
                    <p className="font-semibold text-ink">{contact.companyName}</p>
                  )}
                  <p className="whitespace-pre-line text-ink">{contact.address}</p>
                </DetailRow>

                {phones.length > 0 && (
                  <DetailRow icon={Phone} title={content.phoneLabel || 'Phone'}>
                    {phones.map((phone) => (
                      <p key={phone}>
                        <a
                          href={`tel:${phone.replace(/[\s-]/g, '')}`}
                          className="text-ink hover:text-heading hover:underline"
                        >
                          {phone}
                        </a>
                      </p>
                    ))}
                  </DetailRow>
                )}

                {contact.email && (
                  <DetailRow icon={Mail} title={content.emailLabel || 'Email'}>
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-ink hover:text-heading hover:underline"
                    >
                      {contact.email}
                    </a>
                  </DetailRow>
                )}

                {websiteHref && (
                  <DetailRow icon={Globe} title={content.websiteLabel || 'Website'}>
                    <a
                      href={websiteHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink hover:text-heading hover:underline"
                    >
                      {websiteLabel}
                    </a>
                  </DetailRow>
                )}

                {whatsappUrl && (
                  <div className="mt-5 hidden lg:block">
                    <Button href={whatsappUrl} className="w-full">
                      <MessageCircle className="mr-2 inline" size={20} />
                      {content.whatsappCta || 'Chat on WhatsApp'}
                    </Button>
                  </div>
                )}
              </Card>
            </StaggerItem>

            <StaggerItem>
              <Card className="flex h-full flex-col !p-5 sm:!p-6">
                <h3 className="mb-3 font-display text-lg font-semibold text-heading">
                  {content.mapTitle || 'Location'}
                </h3>
                {contact.googleMapsEmbed ? (
                  <div
                    className="min-h-[280px] flex-1 overflow-hidden rounded-lg [&_iframe]:h-full [&_iframe]:min-h-[280px] [&_iframe]:w-full lg:min-h-[320px]"
                    dangerouslySetInnerHTML={{ __html: contact.googleMapsEmbed }}
                  />
                ) : contact.googleMapsUrl ? (
                  <a
                    href={contact.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex min-h-[280px] flex-1 items-center justify-center rounded-lg bg-neutral-100 text-sm text-primary-600 hover:bg-neutral-200"
                  >
                    View on Google Maps →
                  </a>
                ) : (
                  <p className="text-sm text-neutral-500">{content.mapPlaceholder}</p>
                )}
              </Card>
            </StaggerItem>
          </Stagger>

          <FadeIn>
            <Card className="!p-5 sm:!p-8">
              <div className="mb-6 max-w-2xl">
                <h2 className="font-display text-2xl font-bold text-heading">
                  {content.feedbackTitle || 'Send us feedback'}
                </h2>
                {content.feedbackSubtitle && (
                  <p className="mt-2 text-ink">{content.feedbackSubtitle}</p>
                )}
              </div>
              <FeedbackForm
                whatsapp={contact.whatsapp}
                email={contact.email}
                copy={feedbackCopy}
              />
            </Card>
          </FadeIn>
        </Container>
      </section>
    </>
  )
}
