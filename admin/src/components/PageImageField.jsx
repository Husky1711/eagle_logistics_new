import { useRef, useState } from 'react'
import { api } from '../api/client'
import PageImagePreview from './PageImagePreview'

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

/**
 * Filename field + preview + upload for public/assets/{folder}/.
 */
export default function PageImageField({
  label,
  hint,
  filename,
  onFilenameChange,
  folder = 'pages',
  alt = '',
}) {
  const fileInputRef = useRef(null)
  const [cacheKey, setCacheKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError('')
    setUploadMessage('')
    try {
      const target = filename?.trim() || undefined
      const result = await api.uploadMedia(folder, file, target)
      onFilenameChange(result.filename)
      setCacheKey(Date.now())
      setUploadMessage(
        target ? 'Image updated on the public site.' : 'Image uploaded. Click Save page to publish.',
      )
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const hasFilename = Boolean(filename?.trim())
  const uploadLabel = uploading ? 'Uploading…' : hasFilename ? 'Change image' : 'Upload image'

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-60"
        >
          {uploadLabel}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
      <input
        className={inputClassName()}
        value={filename || ''}
        onChange={(e) => onFilenameChange(e.target.value)}
        placeholder="e.g. special-offers-hero.png"
      />
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
      <div className="mt-3">
        <PageImagePreview
          filename={filename}
          folder={folder}
          alt={alt}
          cacheKey={cacheKey}
          expandable={Boolean(filename?.trim())}
        />
      </div>
      {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      {uploadMessage ? <p className="mt-2 text-xs text-green-700">{uploadMessage}</p> : null}
    </div>
  )
}
