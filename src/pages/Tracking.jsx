import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useContent, combineContentStates } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageContentGate from '../components/common/PageContentGate'
import SmartImage from '../components/common/SmartImage'
import { courierLogoUrl, pageImageUrl, assetUrl } from '../utils/assets'
import { buildWhatsAppUrl, buildTrackingWhatsAppMessage } from '../utils/whatsapp'

export default function Tracking() {
  const pageState = useContent('pages/tracking.json')
  const couriersState = useContent('couriers.json')
  const { settings } = useSettings()
  const { loading, error } = combineContentStates(pageState, couriersState)
  const { data: page } = pageState
  const { data: couriers } = couriersState
  const [courierId, setCourierId] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [formError, setFormError] = useState('')

  return (
    <PageContentGate loading={loading} error={error}>
      <TrackingContent
        page={page}
        couriers={couriers}
        settings={settings}
        courierId={courierId}
        setCourierId={setCourierId}
        trackingId={trackingId}
        setTrackingId={setTrackingId}
        formError={formError}
        setFormError={setFormError}
      />
    </PageContentGate>
  )
}

function CourierLogoTab({ courier, selected, onSelect }) {
  const logo = courierLogoUrl(courier.logo)
  return (
    <button
      type="button"
      onClick={() => onSelect(courier.id)}
      aria-pressed={selected}
      className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-3 transition ${
        selected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
          : 'border-neutral-200 bg-white hover:border-primary-300'
      }`}
    >
      {logo ? (
        <img src={logo} alt={`${courier.name} logo`} className="h-10 max-w-[120px] object-contain" />
      ) : (
        <span className="font-display text-lg font-bold text-primary-600">{courier.name.slice(0, 2)}</span>
      )}
      <span className="text-xs font-semibold text-ink">{courier.name}</span>
    </button>
  )
}

function TrackingContent({
  page,
  couriers,
  settings,
  courierId,
  setCourierId,
  trackingId,
  setTrackingId,
  formError,
  setFormError,
}) {
  const content = page?.content || {}
  const heroSrc = content.heroImage
    ? content.heroImage.includes('/')
      ? assetUrl(`assets/${content.heroImage.replace(/^assets\//, '')}`)
      : pageImageUrl(content.heroImage)
    : null
  const activeCouriers = (couriers || []).filter((c) => c.active).sort((a, b) => a.display_order - b.display_order)
  const featuredIds = content.featuredCourierIds || ['dhl', 'fedex', 'ups']
  const featured = featuredIds
    .map((id) => activeCouriers.find((c) => c.id === id))
    .filter(Boolean)
  const others = activeCouriers.filter((c) => !featuredIds.includes(c.id))

  const handleTrack = (e) => {
    e.preventDefault()
    setFormError('')
    const courier = activeCouriers.find((c) => c.id === courierId)
    if (!courier) {
      setFormError('Please select a courier')
      return
    }
    if (!trackingId.trim()) {
      setFormError('Please enter a tracking number')
      return
    }
    if (!courier.tracking_url?.includes('{id}')) {
      setFormError(content.missingTemplateMessage)
      return
    }
    const url = courier.tracking_url.replace('{id}', encodeURIComponent(trackingId.trim()))
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const whatsappUrl = buildWhatsAppUrl(
    settings?.contact?.whatsapp,
    buildTrackingWhatsAppMessage(trackingId),
  )

  return (
    <>
      <PageMeta meta={page?.meta} />

      <section className="relative overflow-hidden bg-dark text-white">
        {heroSrc && (
          <picture className="absolute inset-0 block h-full w-full">
            <source
              type="image/webp"
              srcSet={heroSrc.replace(/\.jpe?g$/i, '.webp')}
            />
            <SmartImage
              src={heroSrc}
              alt=""
              fill
              loading="eager"
              fetchpriority="high"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
        <Container className="relative z-10 py-20 text-center lg:py-28">
          <h1 className="font-display text-4xl font-bold text-white lg:text-5xl">{content.title}</h1>
          {content.subtitle && (
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{content.subtitle}</p>
          )}
        </Container>
      </section>

      <section className="section-padding bg-primary-50">
        <Container className="max-w-2xl">
          <Card>
            <form onSubmit={handleTrack} className="space-y-6">
              {featured.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-medium text-ink">
                    {content.featuredLabel || 'Popular carriers'}
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {featured.map((courier) => (
                      <CourierLogoTab
                        key={courier.id}
                        courier={courier}
                        selected={courierId === courier.id}
                        onSelect={setCourierId}
                      />
                    ))}
                  </div>
                </div>
              )}

              {others.length > 0 && (
                <div>
                  <label htmlFor="courier" className="mb-2 block text-sm font-medium text-ink">
                    {content.otherLabel || content.courierLabel || 'Other partners'}
                  </label>
                  <select
                    id="courier"
                    value={featuredIds.includes(courierId) ? '' : courierId}
                    onChange={(e) => setCourierId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">Choose another courier...</option>
                    {others.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Tracking Number"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter your tracking number"
                required
              />
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <Button type="submit" className="w-full">
                {content.trackButton || 'Track Shipment'}
                <ExternalLink className="ml-2 inline" size={16} />
              </Button>
            </form>
            <p className="mt-6 text-center text-xs text-neutral-500">{content.redirectNotice}</p>
            {whatsappUrl && (
              <Button href={whatsappUrl} variant="outline" className="mt-4 w-full">
                Need help? WhatsApp us
              </Button>
            )}
          </Card>
        </Container>
      </section>
    </>
  )
}
