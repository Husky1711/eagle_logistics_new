const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/** Parse YYYY-MM-DD as start of that calendar day in IST */
export function isBeforeStartDate(startDate) {
  if (!startDate) return false
  const [year, month, day] = startDate.split('-').map(Number)
  const startOfDayIst = Date.UTC(year, month - 1, day, 0, 0, 0, 0) - IST_OFFSET_MS
  return Date.now() < startOfDayIst
}

/** Parse YYYY-MM-DD as end of that calendar day in IST */
export function isPastEndDate(endDate) {
  if (!endDate) return false
  const [year, month, day] = endDate.split('-').map(Number)
  const endOfDayIst = Date.UTC(year, month - 1, day, 23, 59, 59, 999) - IST_OFFSET_MS
  return Date.now() > endOfDayIst
}

export function isOfferActive(offer) {
  if (!offer?.active) return false
  if (isBeforeStartDate(offer.startDate)) return false
  return !isPastEndDate(offer.endDate)
}
