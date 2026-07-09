import { useId } from 'react'

export default function Input({ label, id, error, className = '', ...props }) {
  const generatedId = useId()
  const inputId = id || generatedId
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}
