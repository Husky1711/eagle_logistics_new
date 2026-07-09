import { Link } from 'react-router-dom'
import Container from '../components/common/Container'
import Button from '../components/common/Button'

export default function NotFound() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="font-display text-6xl font-bold text-primary-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">Page not found</h1>
      <p className="mt-2 text-neutral-600">The page you're looking for doesn't exist or has moved.</p>
      <Button to="/" className="mt-8">
        Back to Home
      </Button>
      <Link to="/contact" className="mt-4 text-sm text-primary-600 hover:underline">
        Contact support
      </Link>
    </Container>
  )
}
