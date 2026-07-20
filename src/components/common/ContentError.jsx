import Container from './Container'

export default function ContentError({ message }) {
  return (
    <Container className="py-20 text-center">
      <p className="text-lg font-medium text-red-600">Failed to load page content.</p>
      {message && <p className="mt-2 text-sm text-ink">{message}</p>}
    </Container>
  )
}
