import { useState } from 'react'
import { useContent, combineContentStates } from '../hooks/useContent'
import { useSettings } from '../context/SettingsContext'
import PageMeta from '../components/common/PageMeta'
import Container from '../components/common/Container'
import Card from '../components/common/Card'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import PageContentGate from '../components/common/PageContentGate'
import { isOfferActive } from '../utils/dates'
import { parsePositiveNumber } from '../utils/numbers'
import { calculatePricing } from '../utils/pricingCalculator'
import { buildWhatsAppUrl, buildPricingWhatsAppMessage } from '../utils/whatsapp'

export default function Pricing() {
  const pageState = useContent('pages/pricing.json')
  const rulesState = useContent('pricing-rules.json')
  const couriersState = useContent('couriers.json')
  const { data: offers } = useContent('offers.json')
  const { settings } = useSettings()

  const { loading, error } = combineContentStates(pageState, rulesState, couriersState)
  const { data: page } = pageState
  const { data: rules } = rulesState
  const { data: couriers } = couriersState

  const [weight, setWeight] = useState('')
  const [distance, setDistance] = useState('')
  const [results, setResults] = useState(null)
  const [formError, setFormError] = useState('')

  const content = page?.content || {}
  const offerActive = isOfferActive(offers)
  const offerCode = offerActive ? offers?.code : undefined

  const handleCalculate = (e) => {
    e.preventDefault()
    setFormError('')
    setResults(null)

    const weightResult = parsePositiveNumber(weight, 'weight (kg)')
    if (weightResult.error) {
      setFormError(weightResult.error)
      return
    }
    const distanceResult = parsePositiveNumber(distance, 'distance (km)')
    if (distanceResult.error) {
      setFormError(distanceResult.error)
      return
    }

    const outcome = calculatePricing({
      weight: weightResult.value,
      distance: distanceResult.value,
      rules,
      couriers,
    })
    if (outcome.error) {
      setFormError(outcome.error)
      return
    }
    setResults(outcome.results)
  }

  const whatsappUrl = buildWhatsAppUrl(
    settings?.contact?.whatsapp,
    buildPricingWhatsAppMessage({
      weight,
      distance,
      code: offerCode,
    }),
  )

  return (
    <PageContentGate loading={loading} error={error}>
      <PageMeta meta={page?.meta} />
      <section className="section-padding bg-neutral-50">
        <Container>
          <div className="mb-12 text-center">
            <h1 className="font-display text-4xl font-bold text-dark">{content.title}</h1>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-600">{content.subtitle}</p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <Card>
              <h2 className="mb-6 font-display text-xl font-semibold">Parcel Details</h2>
              <form onSubmit={handleCalculate} className="space-y-4">
                <Input
                  label="Weight (kg)"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 2.5"
                  required
                />
                <Input
                  label="Distance (km)"
                  type="number"
                  step="1"
                  min="1"
                  value={distance}
                  onChange={(e) => setDistance(e.target.value)}
                  placeholder="e.g. 200"
                  required
                />
                {formError && <p className="text-sm text-red-600">{formError}</p>}
                <Button type="submit" className="w-full">
                  {content.calculateButton || 'Calculate Price'}
                </Button>
              </form>
              <p className="mt-4 text-xs text-neutral-500">{content.notice}</p>
            </Card>

            <div>
              {results && results.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="font-display text-xl font-semibold">Best Options</h2>
                  {results.map((r, i) => (
                    <Card key={r.courier} className={i === 0 ? 'border-gold-500 ring-1 ring-gold-400' : ''}>
                      {i === 0 && (
                        <span className="mb-2 inline-block rounded-full bg-gold-500 px-3 py-0.5 text-xs font-bold text-white">
                          Best Price
                        </span>
                      )}
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-display text-lg font-semibold">{r.courier_name}</h3>
                          {r.estimated_delivery && (
                            <p className="text-sm text-neutral-500">Est. {r.estimated_delivery}</p>
                          )}
                        </div>
                        <p className="font-display text-2xl font-bold text-primary-600">
                          ₹{r.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-neutral-600">
                        <p>Base: ₹{r.breakdown.base_price}</p>
                        <p>
                          Weight ({r.breakdown.weight}kg × ₹{r.breakdown.price_per_kg}/kg): ₹
                          {r.breakdown.weight_cost.toFixed(2)}
                        </p>
                        <p>Zone: {r.breakdown.zone}</p>
                      </div>
                    </Card>
                  ))}
                  {offerActive && content.offerReminder && (
                    <p className="text-sm text-primary-700">{content.offerReminder}</p>
                  )}
                  {whatsappUrl && (
                    <Button href={whatsappUrl} className="w-full">
                      {content.whatsappCta || 'Get Quote on WhatsApp'}
                    </Button>
                  )}
                </div>
              ) : results && results.length === 0 ? (
                <Card className="text-center">
                  <h2 className="font-display text-lg font-semibold">{content.noMatchTitle}</h2>
                  <p className="mt-2 text-neutral-600">{content.noMatchMessage}</p>
                  {whatsappUrl && (
                    <Button href={whatsappUrl} className="mt-4">
                      {content.whatsappCta || 'Get Quote on WhatsApp'}
                    </Button>
                  )}
                </Card>
              ) : (
                <Card className="flex min-h-[280px] items-center justify-center text-center text-neutral-500">
                  Enter parcel details to see sample rates from our rate card
                </Card>
              )}
            </div>
          </div>
        </Container>
      </section>
    </PageContentGate>
  )
}
