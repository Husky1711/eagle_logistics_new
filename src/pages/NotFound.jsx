import { Link } from 'react-router-dom'
import Container from '../components/common/Container'
import Button from '../components/common/Button'
import PageMeta from '../components/common/PageMeta'

const NOT_FOUND_META = {
  title: 'Page Not Found | Eagle Logistics',
  description:
    'The page you requested could not be found. Return to Eagle Logistics home or contact our support team.',
  keywords: ['404', 'Eagle Logistics'],
}

export default function NotFound() {
  return (
    <>
      <PageMeta meta={NOT_FOUND_META} />
      <Container className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
        <p className="font-display text-6xl font-bold text-primary-500">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
        <p className="mt-2 text-neutral-600">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Button to="/" className="mt-8">
          Back to Home
        </Button>
        <Link to="/contact" className="mt-4 text-sm text-primary-600 hover:underline">
          Contact support
        </Link>
      </Container>
    </>
  )
}
