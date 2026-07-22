import { Helmet } from 'react-helmet-async'
import { useLocation } from 'react-router-dom'
import { assetUrl } from '../../utils/assets'

const SITE_URL = (import.meta.env.VITE_PUBLIC_SITE_URL || 'https://www.eaglelogistics.in').replace(
  /\/$/,
  '',
)

const SITE_NAME = 'Eagle Logistics'
const TWITTER_SITE = import.meta.env.VITE_TWITTER_SITE || '@EagleLogisticsE'
const DEFAULT_TITLE = 'Bangalore Courier & International Shipping | Eagle Logistics'
const DEFAULT_DESCRIPTION =
  'Bangalore courier for domestic and international parcels to the USA, UK, EU and Middle East. Doorstep pickup, tracked delivery with DHL, FedEx and UPS.'
const DEFAULT_OG_IMAGE = '/assets/home/international.jpg'
const DEFAULT_OG_IMAGE_ALT = 'International courier and cargo from Eagle Logistics Bangalore'
const DEFAULT_OG_IMAGE_WIDTH = '1200'
const DEFAULT_OG_IMAGE_HEIGHT = '630'

function absoluteUrl(pathOrUrl) {
  if (!pathOrUrl) return `${SITE_URL}${assetUrl(DEFAULT_OG_IMAGE)}`
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl
  const path = assetUrl(pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`)
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

function canonicalFromPath(pathname) {
  if (!pathname || pathname === '/') return `${SITE_URL}/`
  return `${SITE_URL}${pathname.replace(/\/+$/, '')}`
}

/**
 * Production SEO + social meta.
 * Keyword strategy lives in title, description, and H1 — not meta keywords
 * (Google ignores the keywords tag for ranking).
 *
 * meta: { title, description, image?, imageAlt?, canonical?, robots?, ogType? }
 */
export default function PageMeta({ meta }) {
  const { pathname } = useLocation()
  const title = meta?.title || DEFAULT_TITLE
  const description = meta?.description || DEFAULT_DESCRIPTION
  const canonical = meta?.canonical || canonicalFromPath(pathname)
  const image = absoluteUrl(meta?.image || DEFAULT_OG_IMAGE)
  const imageAlt = meta?.imageAlt || DEFAULT_OG_IMAGE_ALT
  const robots = meta?.robots || 'index, follow'
  const ogType = meta?.ogType || 'website'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/assets/brand/logo.png'),
        email: 'info@eaglelogistics.in',
        telephone: '+91-80-40969947',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '15/2, 6th Cross, 1st Main Road, Sampangi Rama Nagar',
          addressLocality: 'Bangalore',
          postalCode: '560027',
          addressCountry: 'IN',
        },
        sameAs: [
          'https://www.facebook.com/pg/Eagle-Logistics-Express-Services-2039127956323457/posts/',
          'https://twitter.com/EagleLogisticsE',
          'https://www.linkedin.com/in/eagle-logistics-and-express-services-b0081864/',
          'https://www.youtube.com/channel/UCKkHKFcXeQsbhTUC6IsDc0g',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        publisher: { '@id': `${SITE_URL}/#organization` },
        inLanguage: 'en-IN',
      },
      {
        '@type': 'WebPage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: title,
        description,
        isPartOf: { '@id': `${SITE_URL}/#website` },
        about: { '@id': `${SITE_URL}/#organization` },
        primaryImageOfPage: { '@type': 'ImageObject', url: image },
        inLanguage: 'en-IN',
      },
    ],
  }

  return (
    <Helmet prioritizeSeoTags htmlAttributes={{ lang: 'en-IN' }}>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <meta name="author" content={SITE_NAME} />
      <meta name="geo.region" content="IN-KA" />
      <meta name="geo.placename" content="Bangalore" />
      <link rel="canonical" href={canonical} />

      <meta property="og:locale" content="en_IN" />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:secure_url" content={image} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:image:type" content={image.endsWith('.png') ? 'image/png' : 'image/jpeg'} />
      <meta property="og:image:width" content={meta?.imageWidth || DEFAULT_OG_IMAGE_WIDTH} />
      <meta property="og:image:height" content={meta?.imageHeight || DEFAULT_OG_IMAGE_HEIGHT} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={TWITTER_SITE} />
      <meta name="twitter:creator" content={TWITTER_SITE} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
    </Helmet>
  )
}
