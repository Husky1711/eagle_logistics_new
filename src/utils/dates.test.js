import { describe, expect, it, vi, afterEach } from 'vitest'
import { isOfferActive, isPastEndDate } from './dates'

describe('isPastEndDate', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false when end date is in the future (IST end of day)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))
    expect(isPastEndDate('2026-08-31')).toBe(false)
  })

  it('returns true when end date has passed in IST', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T20:00:00Z'))
    expect(isPastEndDate('2026-08-31')).toBe(true)
  })

  it('returns false when endDate is missing', () => {
    expect(isPastEndDate()).toBe(false)
  })
})

describe('isOfferActive', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns false when offer is inactive', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))
    expect(isOfferActive({ active: false, endDate: '2026-12-31' })).toBe(false)
  })

  it('returns false when offer is expired', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-01T20:00:00Z'))
    expect(isOfferActive({ active: true, endDate: '2026-08-31' })).toBe(false)
  })

  it('returns true for active offer before end date', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T12:00:00Z'))
    expect(isOfferActive({ active: true, endDate: '2026-08-31' })).toBe(true)
  })
})
