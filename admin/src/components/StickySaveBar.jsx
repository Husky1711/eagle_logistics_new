export default function StickySaveBar({
  isDirty,
  saving,
  onSave,
  lastSavedAt,
  message,
  error,
}) {
  if (!isDirty) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 shadow-lg backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:pl-[252px]">
        <div className="min-w-0">
          <p className="text-sm font-medium text-dark">Unsaved changes</p>
          {lastSavedAt ? (
            <p className="text-xs text-neutral-500">Last saved {lastSavedAt}</p>
          ) : null}
          {error ? <p className="text-xs text-red-600">{error}</p> : null}
          {message ? <p className="text-xs text-green-700">{message}</p> : null}
        </div>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="shrink-0 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save page'}
        </button>
      </div>
    </div>
  )
}
