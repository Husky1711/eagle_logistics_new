/** Destination presets for the price calculator (maps to internal distance zones). */
export const PRICING_DESTINATIONS = [
  { id: 'bangalore', label: 'Within Bangalore', distanceKm: 30 },
  { id: 'india', label: 'Elsewhere in India', distanceKm: 1500 },
  { id: 'uae', label: 'United Arab Emirates', distanceKm: 3500 },
  { id: 'singapore', label: 'Singapore', distanceKm: 4500 },
  { id: 'uk', label: 'United Kingdom', distanceKm: 8500 },
  { id: 'usa', label: 'United States', distanceKm: 14000 },
  { id: 'australia', label: 'Australia', distanceKm: 10000 },
  { id: 'other', label: 'Other international', distanceKm: 16000 },
]

export function getDestinationById(id) {
  return PRICING_DESTINATIONS.find((d) => d.id === id) || null
}
