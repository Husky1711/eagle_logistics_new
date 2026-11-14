import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HeroCarousel({ images = [], reducedMotion = false }) {
  const [index, setIndex] = useState(0)
  const [loaded, setLoaded] = useState(() => new Set())
  const slides = images.length > 0 ? images : [{ url: null, alt: 'Eagle Logistics' }]
  const count = slides.length

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])

  useEffect(() => {
    if (reducedMotion || count <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, reducedMotion, count])

  // Prefetch neighboring slides so swaps feel instant
  useEffect(() => {
    slides.forEach((slide, i) => {
      if (!slide.url || Math.abs(i - index) > 1) return
      const img = new Image()
      img.src = slide.url
      img.onload = () => setLoaded((prev) => new Set(prev).add(slide.url))
    })
  }, [index, slides])

  return (
    <div className="group relative h-full w-full overflow-hidden bg-primary-900">
      {slides.map((slide, i) => {
        const active = i === index
        if (!slide.url) {
          return active ? (
            <div
              key={`fallback-${i}`}
              className="absolute inset-0 bg-gradient-to-br from-primary-600 to-primary-400"
            />
          ) : null
        }
        const isReady = loaded.has(slide.url)
        return (
          <img
            key={slide.url}
            src={slide.url}
            alt={slide.alt || 'Hero slide'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              active && isReady ? 'opacity-100' : 'opacity-0'
            }`}
            decoding="async"
            fetchpriority={i === 0 ? 'high' : 'low'}
            onLoad={() => setLoaded((prev) => new Set(prev).add(slide.url))}
          />
        )
      })}
      <div className="absolute inset-0 bg-black/50" />

      {count > 1 && (
        // Controls sit in one row under the hero text (z-20 keeps them above the
        // text overlay in Home.jsx so they stay clickable and never cover copy).
        <div className="absolute bottom-[4.75rem] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 sm:bottom-[4.5rem] sm:gap-2">
          <button
            type="button"
            onClick={prev}
            className="rounded-full bg-white/90 p-1.5 text-ink shadow-lg transition hover:bg-white"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className="group/dot flex h-8 items-center px-1"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? 'true' : undefined}
              >
                <span
                  className={`block h-2 rounded-full transition-all ${
                    i === index ? 'w-6 bg-white' : 'w-2 bg-white/60 group-hover/dot:bg-white/90'
                  }`}
                />
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-white/90 p-1.5 text-ink shadow-lg transition hover:bg-white"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  )
}
