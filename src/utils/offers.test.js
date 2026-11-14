import { describe, it, expect } from 'vitest'
import { offerStatus, homeStripOffer, formatOfferDate, validityText, todayIST } from './offers'

const T = '2026-11-15'

describe('offerStatus', () => {
  it('is off when not active, regardless of dates', () => {
    expect(offerStatus({ active: false }, T)).toBe('off')
  })
  it('is live with no dates', () => {
    expect(offerStatus({ active: true }, T)).toBe('live')
  })
  it('is live on the start and end day (inclusive)', () => {
    expect(offerStatus({ active: true, startDate: T, endDate: T }, T)).toBe('live')
  })
  it('is scheduled before the start date', () => {
    expect(offerStatus({ active: true, startDate: '2026-11-16' }, T)).toBe('scheduled')
  })
  it('is expired after the end date', () => {
    expect(offerStatus({ active: true, endDate: '2026-11-14' }, T)).toBe('expired')
  })
})

describe('homeStripOffer', () => {
  const offers = [
    { id: 'a', active: true, showOnHome: false, homeStripText: 'A' },
    { id: 'b', active: true, showOnHome: true, homeStripText: '', },
    { id: 'c', active: true, showOnHome: true, homeStripText: 'C', endDate: '2026-01-01' },
    { id: 'd', active: true, showOnHome: true, homeStripText: 'D' },
    { id: 'e', active: true, showOnHome: true, homeStripText: 'E' },
  ]
  it('picks the first live offer with show-on-home and strip text', () => {
    expect(homeStripOffer(offers, T)?.id).toBe('d')
  })
  it('returns null when none qualify', () => {
    expect(homeStripOffer([offers[0]], T)).toBeNull()
  })
})

describe('dates', () => {
  it('formats dates for display', () => {
    expect(formatOfferDate('2026-12-31')).toBe('31 Dec 2026')
    expect(formatOfferDate('bad')).toBe('')
  })
  it('builds validity text', () => {
    expect(validityText({ endDate: '2026-12-31' })).toBe('Valid till 31 Dec 2026')
    expect(validityText({ startDate: '2026-12-01', endDate: '2026-12-31' })).toBe('Valid 1 Dec 2026 – 31 Dec 2026')
    expect(validityText({})).toBe('')
  })
  it('today is IST', () => {
    // 20:00 UTC on 14 Nov is already 15 Nov in India
    expect(todayIST(new Date('2026-11-14T20:00:00Z'))).toBe('2026-11-15')
  })
})
