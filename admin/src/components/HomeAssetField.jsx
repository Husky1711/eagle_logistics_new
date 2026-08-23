import { useRef, useState } from 'react'
import { api } from '../api/client'
import PageImagePreview from './PageImagePreview'

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

export function parseAssetPath(path) {
  if (!path) return { folder: 'home', filename: '' }
  const clean = path.replace(/^assets\//, '').replace(/^\/+/, '')
  const slash = clean.indexOf('/')
  if (slash === -1) return { folder: 'home', filename: clean }
  return { folder: clean.slice(0, slash), filename: clean.slice(slash + 1) }
}

/**
 * Asset path field (e.g. home/domestic.jpg) with preview + upload.
 * layout="inline" — thumb beside path (carousel grid, tile lists).
 */
export default function HomeAssetField({
  label,
  hint,
  value,
  onChange,
  alt = '',
  compact = false,
  thumb = false,
  layout = 'stack',
}) {
  const fileInputRef = useRef(null)
  const [cacheKey, setCacheKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadMessage, setUploadMessage] = useState('')

  const { folder, filename } = parseAssetPath(value)
  const hasImage = Boolean(filename)
  const useThumb = thumb || layout === 'inline'
  const previewCompact = compact && layout !== 'inline'
  const uploadLabel = uploading ? 'Uploading…' : hasImage ? 'Change image' : 'Upload image'

  const handleUpload = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setUploading(true)
    setUploadError('')
    setUploadMessage('')
    try {
      const targetFilename = filename || undefined
      const result = await api.uploadMedia(folder, file, targetFilename)
      const assetPath = result.assetPath || `${result.folder}/${result.filename}`
      onChange(assetPath)
      setCacheKey(Date.now())
      setUploadMessage(
        hasImage ? 'Image updated on the public site.' : 'Image uploaded. Click Save page to publish.',
      )
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const uploadButton = (
    <button
      type="button"
      onClick={() => fileInputRef.current?.click()}
      disabled={uploading}
      className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50 disabled:opacity-60"
    >
      {uploadLabel}
    </button>
  )

  const pathInput = (
    <input
      className={inputClassName()}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="home/domestic.jpg"
    />
  )

  const preview = (
    <PageImagePreview
      filename={filename}
      folder={folder}
      alt={alt}
      compact={previewCompact}
      thumb={useThumb}
      cacheKey={cacheKey}
      expandable={Boolean(filename)}
    />
  )

  const feedback = (
    <>
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
      {uploadError ? <p className="mt-2 text-xs text-red-600">{uploadError}</p> : null}
      {uploadMessage ? <p className="mt-2 text-xs text-green-700">{uploadMessage}</p> : null}
    </>
  )

  if (layout === 'inline') {
    return (
      <div className="rounded-lg border border-neutral-200 p-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleUpload}
        />
        <div className="flex gap-3">
          <div className="shrink-0">{preview}</div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-medium text-neutral-700">{label}</span>
              {uploadButton}
            </div>
            {pathInput}
            {feedback}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">{label}</span>
        {uploadButton}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={handleUpload}
      />
      {pathInput}
      {feedback}
      {filename || useThumb ? <div className="mt-3">{preview}</div> : null}
    </div>
  )
}
