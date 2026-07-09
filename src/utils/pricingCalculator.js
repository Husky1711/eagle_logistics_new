function findZone(zones, distance) {
  const sorted = [...zones].sort((a, b) => a.max_distance - b.max_distance)
  return sorted.find((z) => distance <= z.max_distance) || sorted[sorted.length - 1]
}

function calculatePrice(zone, weight) {
  const weightCost = weight * zone.price_per_kg
  return {
    price: zone.base_price + weightCost,
    breakdown: {
      base_price: zone.base_price,
      weight,
      price_per_kg: zone.price_per_kg,
      weight_cost: weightCost,
      zone: zone.zone,
    },
    estimated_delivery: zone.estimated_delivery,
  }
}

/**
 * Calculate shipping prices from rate card rules.
 * @returns {Array} Top 3 results sorted by price ascending
 */
export function calculatePricing({ weight, distance, rules, couriers }) {
  if (!weight || weight <= 0 || !distance || distance <= 0) {
    return { error: 'Please enter valid weight and distance (greater than 0).' }
  }

  const courierMap = Object.fromEntries((couriers || []).map((c) => [c.id, c]))
  const results = []

  for (const rule of rules || []) {
    if (!rule.active) continue
    const { min, max } = rule.weight_range || {}
    if (weight < min || weight > max) continue

    const zone = findZone(rule.distance_zones || [], distance)
    if (!zone) continue

    const courier = courierMap[rule.courier]
    if (!courier || !courier.active) continue

    const calc = calculatePrice(zone, weight)
    results.push({
      courier: rule.courier,
      courier_name: courier.name,
      price: calc.price,
      breakdown: calc.breakdown,
      estimated_delivery: calc.estimated_delivery,
    })
  }

  results.sort((a, b) => a.price - b.price)
  return { results: results.slice(0, 3) }
}
