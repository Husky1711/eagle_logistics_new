import { describe, expect, it } from 'vitest'
import { parsePositiveNumber } from './numbers'

describe('parsePositiveNumber', () => {
  it('rejects partial numeric strings', () => {
    expect(parsePositiveNumber('2abc', 'weight (kg)').error).toBeTruthy()
  })

  it('accepts valid decimals', () => {
    expect(parsePositiveNumber('2.5', 'weight (kg)').value).toBe(2.5)
  })

  it('rejects zero and negative values', () => {
    expect(parsePositiveNumber('0', 'distance (km)').error).toBeTruthy()
    expect(parsePositiveNumber('-3', 'distance (km)').error).toBeTruthy()
  })
})
