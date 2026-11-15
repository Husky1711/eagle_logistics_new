import { useEffect, useRef, useState } from 'react'
import { Check, Plus, X } from 'lucide-react'

/**
 * On-page replacements for window.prompt / window.confirm — browser pop-ups are
 * blocked in some browsers and embedded views, and they look out of place.
 */

/** "+ Add something" link that turns into an inline text field with Add / Cancel. */
export function InlineAdd({ label, placeholder, onAdd, inputType = 'text', submitLabel = 'Add', icon: Icon = Plus }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const input = useRef(null)

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open])

  function close() {
    setOpen(false)
    setValue('')
    setError('')
  }

  function submit(e) {
    e?.preventDefault()
    const problem = onAdd(value.trim())
    if (problem) setError(problem)
    else close()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold text-primary-600 hover:underline"
      >
        <Icon size={16} aria-hidden /> {label}
      </button>
    )
  }

  return (
    <div className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          ref={input}
          type={inputType}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError('')
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit(e)
            if (e.key === 'Escape') close()
          }}
          placeholder={placeholder}
          aria-label={label}
          className="min-w-0 flex-1 rounded-lg border border-primary-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
        />
        <button type="button" onClick={submit} className="btn-primary px-4 py-2 text-sm">
          {submitLabel}
        </button>
        <button type="button" onClick={close} className="rounded-lg px-2 text-ink hover:bg-neutral-100" aria-label="Cancel">
          <X size={18} />
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

/** Button that asks "Sure?" in place before doing something destructive. */
export function ConfirmButton({ onConfirm, question = 'Sure?', confirmLabel = 'Yes, delete', children, className = '', label }) {
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!asking) return undefined
    const t = window.setTimeout(() => setAsking(false), 6000)
    return () => window.clearTimeout(t)
  }, [asking])

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={className} aria-label={label} title={label}>
        {children}
      </button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 py-1 pl-2.5 pr-1 text-xs font-medium text-red-800" role="group">
      {question}
      <button
        type="button"
        onClick={() => {
          setAsking(false)
          onConfirm()
        }}
        className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 font-semibold text-white hover:bg-red-700"
      >
        <Check size={13} aria-hidden /> {confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)} className="rounded-md px-1.5 py-1 hover:bg-red-100" aria-label="Cancel">
        <X size={13} />
      </button>
    </span>
  )
}
