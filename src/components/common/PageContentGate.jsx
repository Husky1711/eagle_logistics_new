import LoadingSpinner from './LoadingSpinner'
import ContentError from './ContentError'

export default function PageContentGate({ loading, error, children }) {
  if (loading) return <LoadingSpinner />
  if (error) return <ContentError message={error} />
  return children
}
