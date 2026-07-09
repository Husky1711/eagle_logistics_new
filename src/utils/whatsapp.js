export function buildWhatsAppUrl(phone, message) {
  const digits = (phone || '').replace(/\D/g, '')
  const text = encodeURIComponent(message || '')
  return `https://wa.me/${digits}?text=${text}`
}

export function buildPricingWhatsAppMessage({ weight, distance, code }) {
  let msg = `Hi Eagle Logistics, I need a shipping quote: ${weight} kg, ${distance} km. I saw sample rates on your website.`
  if (code) msg += ` I'd like to use code ${code}.`
  return msg
}

export function buildTrackingWhatsAppMessage(trackingId) {
  return `Hi Eagle Logistics, I need help tracking my parcel. Tracking number: ${trackingId}`
}
