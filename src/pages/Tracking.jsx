import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { useContent } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { buildWhatsAppUrl, buildTrackingWhatsAppMessage } from '../utils/whatsapp'

export default function Tracking() {
  const { data: page, loading: pageLoading } = useContent('pages/tracking.json')
  const { data: couriers, loading: couriersLoading } = useContent('couriers.json')
  const { settings } = useSettings()
  const [courierId, setCourierId] = useState('')
  const [trackingId, setTrackingId] = useState('')
  const [error, setError] = useState('')

  if (pageLoading || couriersLoading) return <LoadingSpinner />

  const content = page?.content || {}
  const activeCouriers = (couriers || []).filter((c) => c.active).sort((a, b) => a.display_order - b.display_order)

  const handleTrack = (e) => {
    e.preventDefault()
    setError('')
    const courier = activeCouriers.find((c) => c.id === courierId)
    if (!courier) {
      setError('Please select a courier')
      return
    }
    if (!trackingId.trim()) {
      setError('Please enter a tracking number')
      return
    }
    if (!courier.tracking_url?.includes('{id}')) {
      setError(content.missingTemplateMessage)
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
      <section className="section-padding bg-neutral-50">
        <Container className="max-w-xl">
          <div className="mb-10 text-center">
            <h1 className="font-display text-4xl font-bold text-dark">{content.title}</h1>
            <p className="mt-4 text-neutral-600">{content.subtitle}</p>
          </div>
          <Card>
            <form onSubmit={handleTrack} className="space-y-4">
              <div>
                <label htmlFor="courier" className="mb-2 block text-sm font-medium text-neutral-700">
                  {content.courierLabel || 'Select Courier'}
                </label>
                <select
                  id="courier"
                  value={courierId}
                  onChange={(e) => setCourierId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  required
                >
                  <option value="">Choose a courier...</option>
                  {activeCouriers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Tracking Number"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                placeholder="Enter your tracking number"
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" className="w-full">
                {content.trackButton || 'Track Parcel'}
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
