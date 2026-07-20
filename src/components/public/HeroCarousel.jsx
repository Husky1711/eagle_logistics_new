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
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-ink opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-16 left-1/2 z-10 flex -translate-x-1/2 gap-2 sm:bottom-20">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/60'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
