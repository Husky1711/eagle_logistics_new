import { Helmet } from 'react-helmet-async'

export default function PageMeta({ meta }) {
  if (!meta) return null
  const title = meta.title || 'Eagle Logistics'
  const description = meta.description || ''
  const keywords = Array.isArray(meta.keywords) ? meta.keywords.join(', ') : meta.keywords

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
    </Helmet>
  )
}
