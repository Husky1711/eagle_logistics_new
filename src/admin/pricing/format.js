const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2, minimumFractionDigits: 0 })
const inr0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

/** ₹1,23,456.50 (Indian grouping) */
export const money = (n) => (n === null || n === undefined || n === '' ? '—' : `₹${inr.format(Number(n))}`)
export const money0 = (n) => (n === null || n === undefined || n === '' ? '—' : `₹${inr0.format(Math.round(Number(n)))}`)
export const kg = (n) => `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })} kg`

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

/** Parses "1, 2.5, 3" into sorted unique positive numbers. */
export function parseNumberList(text) {
  return [...new Set(String(text).split(/[\s,]+/).map(Number).filter((n) => Number.isFinite(n) && n > 0))].sort((a, b) => a - b)
}
