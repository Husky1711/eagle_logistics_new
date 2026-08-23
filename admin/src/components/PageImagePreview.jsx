import { useEffect, useState } from 'react'
import { PUBLIC_SITE_URL } from '../config/publicSite'

function sizeClasses({ compact, thumb }) {
  if (thumb) return 'h-16 w-16 shrink-0 text-[10px]'
  if (compact) return 'h-20 w-full text-xs'
  return 'min-h-[120px] w-full text-sm'
}

function imageClasses({ compact, thumb }) {
  if (thumb) return 'h-16 w-16 rounded-lg border border-neutral-200 bg-white object-cover p-0.5'
  if (compact) return 'h-20 w-full rounded-lg border border-neutral-200 bg-white object-contain p-1'
  return 'max-h-64 w-full rounded-lg border border-neutral-200 bg-white object-contain'
}

function ZoomIcon({ className = 'h-5 w-5' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
      <path d="M11 8v6M8 11h6" />
    </svg>
  )
}

function ImageLightbox({ open, src, alt, caption, onClose }) {
  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-neutral-900/75"
        aria-label="Close preview"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={alt || 'Image preview'}
        className="relative z-10 flex max-h-[90vh] max-w-4xl flex-col items-center gap-3"
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[80vh] max-w-full rounded-lg border border-white/20 bg-white object-contain shadow-2xl"
        />
        {caption ? <p className="rounded-lg bg-white/95 px-3 py-1.5 text-xs text-neutral-600">{caption}</p> : null}
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/30 bg-white/95 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-white"
        >
          Close
        </button>
      </div>
    </div>
  )
}

/**
 * Preview for page assets in public/assets/{folder}/.
 * Shows thumbnail or a clear missing-image state (Couriers logo pattern).
 * Set expandable to allow click-to-preview (lightbox).
 */
export default function PageImagePreview({
  filename,
  folder = 'pages',
  alt = '',
  compact = false,
  thumb = false,
  cacheKey = 0,
  expandable = false,
}) {
  const [failed, setFailed] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const base = filename ? `${PUBLIC_SITE_URL}/assets/${folder}/${filename}` : ''
  const src = base && cacheKey ? `${base}?v=${cacheKey}` : base
  const placeholderClass = sizeClasses({ compact, thumb })
  const canExpand = expandable && filename && !failed

  const lightbox = (
    <ImageLightbox
      open={expanded}
      src={src}
      alt={alt || filename}
      caption={`${folder}/${filename}`}
      onClose={() => setExpanded(false)}
    />
  )

  if (!filename) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 ${placeholderClass}`}
      >
        {thumb ? '—' : 'No image selected'}
      </div>
    )
  }

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 ${
          thumb ? 'h-16 w-16 shrink-0 px-1 text-[9px] leading-tight' : `${placeholderClass} px-4`
        }`}
        title="Image not found"
      >
        <span className="font-medium">{thumb ? '404' : 'Image not found'}</span>
        {!thumb ? (
          <span className="text-center text-xs text-amber-800/80">
            Check filename or use Upload to add the file
          </span>
        ) : null}
      </div>
    )
  }

  const image = (
    <img
      src={src}
      alt={alt || filename}
      className={imageClasses({ compact, thumb })}
      onError={() => setFailed(true)}
      onLoad={() => setFailed(false)}
    />
  )

  if (!canExpand) return image

  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`group relative rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
          thumb ? 'cursor-zoom-in' : 'block w-full cursor-zoom-in'
        }`}
        title="Click to preview"
        aria-label={`Preview ${alt || filename}`}
      >
        <span className={`relative block overflow-hidden rounded-lg ${thumb ? '' : 'w-full'}`}>
          <span className="block transition group-hover:brightness-75">{image}</span>
          <span
            className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-900/40 opacity-0 transition-opacity group-hover:opacity-100 ${
              thumb ? '' : ''
            }`}
          >
            <span className="flex items-center justify-center rounded-full bg-white/95 p-1.5 text-neutral-800 shadow-sm">
              <ZoomIcon className={thumb ? 'h-4 w-4' : 'h-5 w-5'} />
            </span>
          </span>
        </span>
      </button>
      {lightbox}
    </>
  )
}
