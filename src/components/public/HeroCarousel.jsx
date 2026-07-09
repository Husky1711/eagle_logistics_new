import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function HeroCarousel({ images = [], reducedMotion = false }) {
  const [index, setIndex] = useState(0)
  const slides = images.length > 0 ? images : [{ url: null, alt: 'Eagle Logistics' }]
  const count = slides.length

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count])
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count])

  useEffect(() => {
    if (reducedMotion || count <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, reducedMotion, count])

  const current = slides[index]

  return (
    <div className="group relative h-full w-full overflow-hidden bg-dark">
      {current.url ? (
        <img
          src={current.url}
          alt={current.alt || 'Hero slide'}
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
          fetchpriority={index === 0 ? 'high' : 'low'}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-gold-600" />
      )}
      <div className="absolute inset-0 bg-black/50" />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 text-neutral-800 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 focus:opacity-100"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
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
