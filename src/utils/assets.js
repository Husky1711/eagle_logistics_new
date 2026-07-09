const BASE = import.meta.env.BASE_URL || '/'

export function contentUrl(path) {
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${BASE}content/${clean}`.replace(/\/+/g, '/')
}

export function assetUrl(path) {
  if (!path) return ''
  if (path.startsWith('http')) return path
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${BASE}${clean}`.replace(/\/+/g, '/')
}

export function courierLogoUrl(filename) {
  if (!filename) return null
  return assetUrl(`assets/couriers/${filename}`)
}

export function heroImageUrl(filename) {
  if (!filename) return null
  return assetUrl(`assets/hero/${filename}`)
}

export function pageImageUrl(filename) {
  if (!filename) return null
  return assetUrl(`assets/pages/${filename}`)
}
