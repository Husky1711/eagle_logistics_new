export default function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        role="status"
        aria-label="Loading"
      />
      <p className="text-sm text-neutral-500">{message}</p>
    </div>
  )
}
