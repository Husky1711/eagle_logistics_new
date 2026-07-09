/**
 * Parse a positive number from form input without silent partial parses (e.g. "2abc" → 2).
 */
export function parsePositiveNumber(value, label) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || !/^\d+(\.\d+)?$/.test(trimmed)) {
    return { error: `Please enter a valid ${label}.` }
  }
  const num = Number(trimmed)
  if (!Number.isFinite(num) || num <= 0) {
    return { error: `Please enter a valid ${label} greater than 0.` }
  }
  return { value: num }
}
