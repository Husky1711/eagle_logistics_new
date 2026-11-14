/** Offer helpers shared by the public site and the admin (dates are YYYY-MM-DD, IST). */

export function todayIST(now = new Date()) {
  // en-CA formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now)
}

/** 'live' | 'scheduled' | 'expired' | 'off' — mirrors is_live() in public/api/offers.php */
export function offerStatus(offer, today = todayIST()) {
  if (!offer?.active) return 'off'
  if (offer.startDate && offer.startDate > today) return 'scheduled'
  if (offer.endDate && offer.endDate < today) return 'expired'
  return 'live'
}

export function isOfferLive(offer, today) {
  return offerStatus(offer, today) === 'live'
}

/** First live offer marked "show on home" that has strip text. */
export function homeStripOffer(offers = [], today) {
  return offers.find((o) => isOfferLive(o, today) && o.showOnHome && o.homeStripText) || null
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-12-31' -> '31 Dec 2026' */
export function formatOfferDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return ''
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

export function validityText(offer) {
  const start = formatOfferDate(offer?.startDate)
  const end = formatOfferDate(offer?.endDate)
  if (start && end) return `Valid ${start} – ${end}`
  if (end) return `Valid till ${end}`
  if (start) return `From ${start}`
  return ''
}
