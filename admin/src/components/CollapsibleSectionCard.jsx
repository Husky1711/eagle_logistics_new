import { useState } from 'react'

/**
 * Section card that can collapse. Supports controlled open state for section nav.
 */
export default function CollapsibleSectionCard({
  id,
  title,
  description,
  summary,
  open,
  defaultOpen = false,
  onOpenChange,
  children,
}) {
  const panelId = `section-panel-${id}`
  const isControlled = open !== undefined
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isOpen = isControlled ? open : internalOpen

  const setOpen = (next) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white shadow-soft"
    >
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => setOpen(!isOpen)}
        className="w-full p-5 text-left sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="min-w-0 flex-1 font-semibold text-dark">{title}</h2>
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 text-base leading-none text-neutral-600"
            aria-hidden
          >
            {isOpen ? '−' : '+'}
          </span>
        </div>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
        {!isOpen && summary ? (
          <p className="mt-2 truncate text-xs text-neutral-500">{summary}</p>
        ) : null}
      </button>
      {isOpen ? (
        <div id={panelId} className="space-y-4 border-t border-neutral-100 px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
          {children}
        </div>
      ) : null}
    </section>
  )
}
