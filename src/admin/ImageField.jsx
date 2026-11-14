import { useRef, useState } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { api } from './api'

/**
 * Upload / replace / remove one image. Checks type, size and shape in the
 * browser first so the client gets instant, friendly feedback.
 * recommended: { width, height } in px, e.g. 1200 × 800
 */
export default function ImageField({ label, value, onChange, recommended, help }) {
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState('')

  async function pick(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError('')
    setWarning('')
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return setError('Use a JPG, PNG or WebP image')
    if (file.size > 2 * 1024 * 1024) return setError(`Image is ${(file.size / 1048576).toFixed(1)} MB — max 2 MB`)

    const dims = await imageSize(file).catch(() => null)
    if (dims && recommended) {
      const want = recommended.width / recommended.height
      const got = dims.width / dims.height
      if (Math.abs(got - want) / want > 0.15) {
        setWarning(
          `This image is ${dims.width} × ${dims.height} px. Best shape is ${recommended.width} × ${recommended.height} px — edges may be cropped.`,
        )
      }
    }

    setBusy(true)
    try {
      const res = await api.upload(file)
      onChange(res.url)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <p className="mb-2 block text-sm font-medium text-ink">{label}</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div
          className="flex aspect-[3/2] w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-neutral-300 bg-neutral-50 sm:w-48"
          style={recommended ? { aspectRatio: `${recommended.width} / ${recommended.height}` } : undefined}
        >
          {value ? (
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="px-2 text-center text-xs text-ink-soft">No image</span>
          )}
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-primary-300 bg-white px-3 py-2 font-semibold text-primary-600 hover:bg-primary-50"
            >
              <ImagePlus size={16} aria-hidden />
              {busy ? 'Uploading…' : value ? 'Replace image' : 'Upload image'}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} aria-hidden />
                Remove
              </button>
            )}
          </div>
          {recommended && (
            <p className="text-xs text-ink-soft">
              Best size: <strong>{recommended.width} × {recommended.height} px</strong> · JPG, PNG or WebP · under 2 MB
            </p>
          )}
          {help && <p className="text-xs text-ink-soft">{help}</p>}
          {warning && <p className="rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">{warning}</p>}
          {error && (
            <p role="alert" className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
    </div>
  )
}

function imageSize(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = (e) => {
      URL.revokeObjectURL(url)
      reject(e)
    }
    img.src = url
  })
}
