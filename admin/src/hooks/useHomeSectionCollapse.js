import { useCallback, useState } from 'react'

const STORAGE_KEY = 'eagle-admin-home-sections'

/** Default collapsed: carousel, popular, advantages, SEO. Hero text open. */
export const HOME_SECTION_DEFAULTS = {
  'home-hero-text': true,
  'home-hero-carousel': false,
  'home-seo': false,
  'home-intro': false,
  'home-mission': false,
  'home-service-cards': false,
  'home-advantages': false,
  'home-popular-items': false,
  'home-testimonials': false,
  'home-cargo': false,
  'home-cta': false,
}

export const HOME_SECTIONS = [
  { id: 'home-hero-text', label: 'Hero text' },
  { id: 'home-hero-carousel', label: 'Carousel' },
  { id: 'home-seo', label: 'SEO' },
  { id: 'home-intro', label: 'Why Eagle' },
  { id: 'home-mission', label: 'Mission' },
  { id: 'home-service-cards', label: 'Service cards' },
  { id: 'home-advantages', label: 'Advantages' },
  { id: 'home-popular-items', label: 'Popular items' },
  { id: 'home-testimonials', label: 'Testimonials' },
  { id: 'home-cargo', label: 'Cargo' },
  { id: 'home-cta', label: 'Bottom CTA' },
]

function loadOpenSections() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...HOME_SECTION_DEFAULTS }
    const parsed = JSON.parse(raw)
    return { ...HOME_SECTION_DEFAULTS, ...parsed }
  } catch {
    return { ...HOME_SECTION_DEFAULTS }
  }
}

function persistOpenSections(sections) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sections))
  } catch {
    /* ignore quota errors */
  }
}

export function useHomeSectionCollapse() {
  const [openSections, setOpenSections] = useState(loadOpenSections)

  const setSectionOpen = useCallback((id, open) => {
    setOpenSections((prev) => {
      const next = { ...prev, [id]: open }
      persistOpenSections(next)
      return next
    })
  }, [])

  const navigateToSection = useCallback(
    (id) => {
      setSectionOpen(id, true)
      requestAnimationFrame(() => {
        const el = document.getElementById(id)
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const focusable = el?.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled])')
        focusable?.focus({ preventScroll: true })
      })
    },
    [setSectionOpen],
  )

  return { openSections, setSectionOpen, navigateToSection }
}
