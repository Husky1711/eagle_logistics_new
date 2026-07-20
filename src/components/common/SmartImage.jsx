import { useLayoutEffect, useRef, useState } from 'react'

/**
 * Soft fade-in image so loads don't hard-pop (flash) into view.
 * Parent should keep a solid bg; image fades from transparent → visible.
 */
export default function SmartImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  fill = false,
  loading = 'lazy',
  decoding = 'async',
  fetchpriority,
  ...props
}) {
  const ref = useRef(null)
  const [loaded, setLoaded] = useState(false)

  useLayoutEffect(() => {
    setLoaded(false)
    const el = ref.current
    if (el?.complete && el.naturalWidth > 0) setLoaded(true)
  }, [src])

  if (!src) return null

  const img = (
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={loading}
      decoding={decoding}
      fetchpriority={fetchpriority}
      className={`${className} transition-opacity duration-500 ease-out ${
        loaded ? '' : '!opacity-0'
      }`}
      onLoad={() => setLoaded(true)}
      {...props}
    />
  )

  if (fill) return img

  return (
    <span className={`relative block overflow-hidden bg-primary-100/80 ${wrapperClassName}`}>
      {img}
    </span>
  )
}
