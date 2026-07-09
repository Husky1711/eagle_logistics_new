import { Mail, MapPin, Phone, MessageCircle, Clock } from 'lucide-react'
import { useContent, combineContentStates } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import PageContentGate from '../components/common/PageContentGate'
import { buildWhatsAppUrl } from '../utils/whatsapp'

export default function Contact() {
  const pageState = useContent('pages/contact.json')
  const { settings, loading: settingsLoading } = useSettings()
  const { loading: pageLoading, error } = combineContentStates(pageState)
  const { data: page } = pageState

  return (
    <PageContentGate loading={pageLoading || settingsLoading} error={error}>
      <ContactContent page={page} contact={settings?.contact || {}} />
    </PageContentGate>
  )
}

function ContactContent({ page, contact }) {
  const content = page?.content || {}
  const whatsappUrl = buildWhatsAppUrl(contact.whatsapp, 'Hi Eagle Logistics, I have a shipping inquiry.')

  return (
    <>
      <PageMeta meta={page?.meta} />
      <section className="section-padding bg-neutral-50">
        <Container>
          <div className="mb-12 text-center">
            <h1 className="font-display text-4xl font-bold text-dark">{content.title}</h1>
            <p className="mt-4 text-neutral-600">{content.subtitle}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              {whatsappUrl && (
                <Card className="border-primary-200 bg-primary-50 lg:hidden">
                  <Button href={whatsappUrl} className="w-full">
                    <MessageCircle className="mr-2 inline" size={20} />
                    {content.whatsappCta || 'Chat on WhatsApp'}
                  </Button>
                </Card>
              )}

              <Card className="flex gap-4">
                <MapPin className="shrink-0 text-primary-500" size={24} />
                <div>
                  <h3 className="font-semibold">Address</h3>
                  <p className="mt-1 text-sm text-neutral-600">{contact.address}</p>
                </div>
              </Card>

              <Card className="flex gap-4">
                <Phone className="shrink-0 text-primary-500" size={24} />
                <div>
                  <h3 className="font-semibold">Phone</h3>
                  <a href={`tel:${contact.phone?.replace(/\s/g, '')}`} className="mt-1 text-sm text-primary-600 hover:underline">
                    {contact.phone}
                  </a>
                </div>
              </Card>

              <Card className="flex gap-4">
                <MessageCircle className="shrink-0 text-primary-500" size={24} />
                <div>
                  <h3 className="font-semibold">WhatsApp</h3>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-sm text-primary-600 hover:underline">
                    {contact.whatsapp}
                  </a>
                </div>
              </Card>

              <Card className="flex gap-4">
                <Mail className="shrink-0 text-primary-500" size={24} />
                <div>
                  <h3 className="font-semibold">Email</h3>
                  <a href={`mailto:${contact.email}`} className="mt-1 text-sm text-primary-600 hover:underline">
                    {contact.email}
                  </a>
                </div>
              </Card>

              {contact.hours && (
                <Card className="flex gap-4">
                  <Clock className="shrink-0 text-primary-500" size={24} />
                  <div>
                    <h3 className="font-semibold">Hours</h3>
                    <p className="mt-1 text-sm text-neutral-600">{contact.hours}</p>
                  </div>
                </Card>
              )}

              {whatsappUrl && (
                <div className="hidden lg:block">
                  <Button href={whatsappUrl} className="w-full">
                    <MessageCircle className="mr-2 inline" size={20} />
                    {content.whatsappCta || 'Chat on WhatsApp'}
                  </Button>
                </div>
              )}
            </div>

            <Card>
              <h3 className="mb-4 font-display text-lg font-semibold">{content.mapTitle || 'Find Us'}</h3>
              {contact.googleMapsEmbed ? (
                // Repo-controlled embed HTML from settings.json — sanitize in Project 2 admin
                <div className="aspect-video overflow-hidden rounded-lg" dangerouslySetInnerHTML={{ __html: contact.googleMapsEmbed }} />
              ) : contact.googleMapsUrl ? (
                <a
                  href={contact.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex aspect-video items-center justify-center rounded-lg bg-neutral-100 text-sm text-primary-600 hover:bg-neutral-200"
                >
                  View on Google Maps →
                </a>
              ) : (
                <p className="text-sm text-neutral-500">{content.mapPlaceholder}</p>
              )}
            </Card>
          </div>
        </Container>
      </section>
    </>
  )
}
