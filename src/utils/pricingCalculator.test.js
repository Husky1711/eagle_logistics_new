import { describe, expect, it } from 'vitest'
import { calculatePricing } from './pricingCalculator'

const couriers = [
  { id: 'dtdc', name: 'DTDC', active: true },
  { id: 'delhivery', name: 'Delhivery', active: true },
  { id: 'inactive', name: 'Inactive Co', active: false },
]

const rules = [
  {
    id: 'dtdc-standard',
    courier: 'dtdc',
    weight_range: { min: 0, max: 10 },
    distance_zones: [
      { zone: 'local', max_distance: 50, base_price: 45, price_per_kg: 12, estimated_delivery: '1–2 days' },
      { zone: 'national', max_distance: 99999, base_price: 130, price_per_kg: 24, estimated_delivery: '4–7 days' },
    ],
    active: true,
  },
  {
    id: 'delhivery-standard',
    courier: 'delhivery',
    weight_range: { min: 0, max: 10 },
    distance_zones: [
      { zone: 'local', max_distance: 50, base_price: 42, price_per_kg: 11, estimated_delivery: '1–2 days' },
      { zone: 'national', max_distance: 99999, base_price: 125, price_per_kg: 22, estimated_delivery: '4–7 days' },
    ],
    active: true,
  },
  {
    id: 'inactive-rule',
    courier: 'inactive',
    weight_range: { min: 0, max: 10 },
    distance_zones: [
      { zone: 'local', max_distance: 50, base_price: 10, price_per_kg: 1, estimated_delivery: '1 day' },
    ],
    active: true,
  },
]

describe('calculatePricing', () => {
  it('returns error for invalid weight or distance', () => {
    expect(calculatePricing({ weight: 0, distance: 100, rules, couriers }).error).toBeTruthy()
    expect(calculatePricing({ weight: 2, distance: -1, rules, couriers }).error).toBeTruthy()
  })

  it('returns top 3 results sorted by price ascending', () => {
    const { results } = calculatePricing({ weight: 2, distance: 30, rules, couriers })
    expect(results).toHaveLength(2)
    expect(results[0].price).toBeLessThanOrEqual(results[1].price)
    expect(results[0].courier_name).toBe('Delhivery')
  })

  it('excludes inactive couriers', () => {
    const { results } = calculatePricing({ weight: 2, distance: 30, rules, couriers })
    expect(results.every((r) => r.courier !== 'inactive')).toBe(true)
  })

  it('selects zone based on distance', () => {
    const { results } = calculatePricing({ weight: 1, distance: 500, rules, couriers })
    expect(results[0].breakdown.zone).toBe('national')
  })

  it('returns empty results when weight is out of range', () => {
    const { results } = calculatePricing({ weight: 15, distance: 100, rules, couriers })
    expect(results).toHaveLength(0)
  })
})
