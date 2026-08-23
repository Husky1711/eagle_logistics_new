import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PUBLIC_SITE_URL } from '../config/publicSite'
import PageImageField from '../components/PageImageField'
import ConfirmDialog from '../components/ConfirmDialog'
import StickySaveBar from '../components/StickySaveBar'
import useUnsavedChangesGuard from '../hooks/useUnsavedChangesGuard'
import { formatSavedAt } from '../utils/formatSavedAt'

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

function SectionCard({ title, description, children }) {
  return (
    <section className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-soft sm:p-6">
      <div>
        <h2 className="font-semibold text-dark">{title}</h2>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}

function ListEditor({ label, hint, items, onChange, placeholder, itemLabel = 'item' }) {
  const [removeIndex, setRemoveIndex] = useState(null)

  const updateItem = (index, value) => {
    const next = [...items]
    next[index] = value
    onChange(next)
  }

  const confirmRemove = () => {
    if (removeIndex === null) return
    onChange(items.filter((_, i) => i !== removeIndex))
    setRemoveIndex(null)
  }

  const pendingItem = removeIndex !== null ? items[removeIndex] : ''

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-neutral-700">{label}</p>
          {hint ? <p className="text-xs text-neutral-500">{hint}</p> : null}
        </div>
        <button
          type="button"
          onClick={() => onChange([...items, ''])}
          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50"
        >
          + Add
        </button>
      </div>
      <div className="space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-neutral-500">No items yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <input
                className={inputClassName()}
                value={item}
                placeholder={placeholder}
                onChange={(e) => updateItem(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => setRemoveIndex(index)}
                className="shrink-0 rounded-lg border border-red-200 px-2 text-xs text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <ConfirmDialog
        open={removeIndex !== null}
        title={`Remove ${itemLabel}?`}
        message={
          pendingItem?.trim()
            ? `Remove "${pendingItem.trim()}" from the page? You can undo by not saving.`
            : `Remove this empty ${itemLabel}?`
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveIndex(null)}
        danger
      />
    </div>
  )
}

const UNIVERSITY_ID = 'university'

function emptyUniversitySection() {
  return {
    id: UNIVERSITY_ID,
    title: 'University applications',
    subtitle: '',
    lead: '',
    reassure: '',
    body: [],
    featuresTitle: 'Special features',
    features: [],
  }
}

function getUniversitySection(sections) {
  return (sections || []).find((s) => s.id === UNIVERSITY_ID) || emptyUniversitySection()
}

function buildCleanPayload(data) {
  const university = getUniversitySection(data.content.sections)
  return {
    ...data,
    content: {
      ...data.content,
      body: (data.content.body || []).map((line) => line.trim()).filter(Boolean),
      features: (data.content.features || []).map((line) => line.trim()).filter(Boolean),
      promoCard: {
        ...data.content.promoCard,
        items: (data.content.promoCard?.items || []).map((line) => line.trim()).filter(Boolean),
      },
      sections: (data.content.sections || []).map((section) =>
        section.id === UNIVERSITY_ID
          ? {
              ...university,
              body: (university.body || []).map((line) => line.trim()).filter(Boolean),
              features: (university.features || []).map((line) => line.trim()).filter(Boolean),
            }
          : section,
      ),
    },
  }
}

export default function OffersPage() {
  const [data, setData] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getOffersPage(), api.getMeta()])
      .then(([page, meta]) => {
        setData(page)
        setSavedSnapshot(JSON.stringify(page))
        setLastSavedAt(meta.offers_page_saved_at)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const isDirty = useMemo(() => {
    if (!data || savedSnapshot === null) return false
    return JSON.stringify(data) !== savedSnapshot
  }, [data, savedSnapshot])

  useUnsavedChangesGuard(isDirty)

  const updateContent = (patch) => {
    setMessage('')
    setData((current) => ({
      ...current,
      content: { ...current.content, ...patch },
    }))
  }

  const updateMeta = (patch) => {
    setMessage('')
    setData((current) => ({
      ...current,
      meta: { ...current.meta, ...patch },
    }))
  }

  const updatePromo = (patch) => {
    setMessage('')
    setData((current) => ({
      ...current,
      content: {
        ...current.content,
        promoCard: { ...current.content.promoCard, ...patch },
      },
    }))
  }

  const updateUniversity = (patch) => {
    setMessage('')
    setData((current) => {
      const sections = [...(current.content.sections || [])]
      const index = sections.findIndex((s) => s.id === UNIVERSITY_ID)
      const existing = index >= 0 ? sections[index] : emptyUniversitySection()
      const updated = { ...existing, ...patch, id: UNIVERSITY_ID }
      if (index >= 0) {
        sections[index] = updated
      } else {
        sections.push(updated)
      }
      return {
        ...current,
        content: { ...current.content, sections },
      }
    })
  }

  const handleSave = async (event) => {
    event?.preventDefault()
    if (!data || saving) return

    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await api.updateOffersPage(buildCleanPayload(data))
      setData(updated)
      setSavedSnapshot(JSON.stringify(updated))
      const meta = await api.getMeta()
      setLastSavedAt(meta.offers_page_saved_at)
      setMessage('Special Offers page saved and synced to the public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading Special Offers page…</p>
  if (!data) return <p className="text-red-600">{error || 'Failed to load Special Offers page'}</p>

  const content = data.content || {}
  const meta = data.meta || {}
  const promo = content.promoCard || {}
  const university = getUniversitySection(content.sections)
  const lastSavedLabel = formatSavedAt(lastSavedAt)

  return (
    <>
      <form onSubmit={handleSave} className={`space-y-6 ${isDirty ? 'pb-24' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-dark">Special Offers page</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Edit the full <code className="text-xs">/offers</code> page. For the small promo strip on
              every page, use <strong>Homepage offer strip</strong> in the sidebar.
            </p>
            {lastSavedLabel ? (
              <p className="mt-1 text-xs text-neutral-500">Last saved {lastSavedLabel}</p>
            ) : null}
            {isDirty ? (
              <p className="mt-1 text-xs font-medium text-amber-700">You have unsaved changes</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`${PUBLIC_SITE_URL}/offers`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Preview page ↗
            </a>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save page'}
            </button>
          </div>
        </div>

        <SectionCard
          title="Google & social (SEO)"
          description="Browser tab title and Google search snippet for /offers."
        >
          <Field label="Page title (SEO)" hint="Shown in browser tab and Google results.">
            <input
              className={inputClassName()}
              value={meta.title || ''}
              onChange={(e) => updateMeta({ title: e.target.value })}
            />
          </Field>
          <Field label="Meta description" hint="Short summary for Google (about 150 characters).">
            <textarea
              className={inputClassName()}
              rows={3}
              value={meta.description || ''}
              onChange={(e) => updateMeta({ description: e.target.value })}
            />
          </Field>
          <Field
            label="Social share image path"
            hint="Optional. Path like /assets/pages/special-offers-hero.png for Facebook/WhatsApp previews."
          >
            <input
              className={inputClassName()}
              value={meta.image || ''}
              onChange={(e) => updateMeta({ image: e.target.value })}
            />
          </Field>
          <Field label="Social image alt text">
            <input
              className={inputClassName()}
              value={meta.imageAlt || ''}
              onChange={(e) => updateMeta({ imageAlt: e.target.value })}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Page header" description="Title and hero image shown at the top of /offers.">
          <Field label="Page title">
            <input
              className={inputClassName()}
              value={content.title || ''}
              onChange={(e) => updateContent({ title: e.target.value })}
            />
          </Field>
          <PageImageField
            label="Hero image"
            hint="PNG, JPG, or WebP up to 2 MB. Upload replaces the file on the public site immediately."
            filename={content.heroImage || ''}
            onFilenameChange={(heroImage) => updateContent({ heroImage })}
            alt="Hero preview"
          />
          <Field
            label="“Current promo” badge label"
            hint="Text on the blue badge above the festive offer strip on this page."
          >
            <input
              className={inputClassName()}
              value={content.currentPromoLabel || ''}
              onChange={(e) => updateContent({ currentPromoLabel: e.target.value })}
            />
          </Field>
        </SectionCard>

        <SectionCard title="Intro story" description="Left-column festive story copy.">
          <Field label="Headline">
            <input
              className={inputClassName()}
              value={content.headline || ''}
              onChange={(e) => updateContent({ headline: e.target.value })}
            />
          </Field>
          <Field label="Lead line">
            <input
              className={inputClassName()}
              value={content.lead || ''}
              onChange={(e) => updateContent({ lead: e.target.value })}
            />
          </Field>
          <Field label="Reassure line">
            <input
              className={inputClassName()}
              value={content.reassure || ''}
              onChange={(e) => updateContent({ reassure: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Body paragraphs"
            hint="Each item is one paragraph on the page."
            items={content.body || []}
            onChange={(body) => updateContent({ body })}
            placeholder="Paragraph text"
            itemLabel="paragraph"
          />
          <Field label="Offer note / disclaimer">
            <textarea
              className={inputClassName()}
              rows={3}
              value={content.offerNote || ''}
              onChange={(e) => updateContent({ offerNote: e.target.value })}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Promo poster"
          description="Yellow rate banner (editable text) + poster graphic (image file)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Banner line 1" hint="e.g. Send parcels to the USA from Bangalore">
              <input
                className={inputClassName()}
                value={promo.line1 || ''}
                onChange={(e) => updatePromo({ line1: e.target.value })}
              />
            </Field>
            <Field label="Banner line 2 (price)" hint="Use plain text: ₹567 per kg*">
              <input
                className={inputClassName()}
                value={promo.line2 || ''}
                onChange={(e) => updatePromo({ line2: e.target.value })}
              />
            </Field>
          </div>
          <PageImageField
            label="Poster image"
            hint="Graphic below the yellow banner. Items on the poster are part of this image — use Replace to update it."
            filename={promo.image || ''}
            onFilenameChange={(image) => updatePromo({ image })}
            alt="Poster preview"
          />
          <ListEditor
            label="Items list (reference only)"
            hint="These appear on the poster PNG, not as live text on the site. Update the poster image to change them, or keep this list for your records."
            items={promo.items || []}
            onChange={(items) => updatePromo({ items })}
            placeholder="Item name"
            itemLabel="item"
          />
          <Field label="Disclaimer">
            <input
              className={inputClassName()}
              value={promo.disclaimer || ''}
              onChange={(e) => updatePromo({ disclaimer: e.target.value })}
            />
          </Field>
        </SectionCard>

        <SectionCard
          title="Buttons"
          description="Button labels on this page. WhatsApp number comes from Settings (sitewide)."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button text" hint="Usually links to Price Calculator.">
              <input
                className={inputClassName()}
                value={content.ctaDefault || ''}
                onChange={(e) => updateContent({ ctaDefault: e.target.value })}
              />
            </Field>
            <Field label="WhatsApp button text">
              <input
                className={inputClassName()}
                value={content.whatsappCta || ''}
                onChange={(e) => updateContent({ whatsappCta: e.target.value })}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard title="Special features" description="Bullet list below the intro and poster.">
          <Field label="Section title">
            <input
              className={inputClassName()}
              value={content.featuresTitle || ''}
              onChange={(e) => updateContent({ featuresTitle: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Feature bullets"
            items={content.features || []}
            onChange={(features) => updateContent({ features })}
            placeholder="Feature text"
            itemLabel="feature"
          />
        </SectionCard>

        <SectionCard
          title="University applications"
          description="Student courier section shown below the features on /offers."
        >
          <Field label="Section title">
            <input
              className={inputClassName()}
              value={university.title || ''}
              onChange={(e) => updateUniversity({ title: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <input
              className={inputClassName()}
              value={university.subtitle || ''}
              onChange={(e) => updateUniversity({ subtitle: e.target.value })}
            />
          </Field>
          <Field label="Lead line">
            <input
              className={inputClassName()}
              value={university.lead || ''}
              onChange={(e) => updateUniversity({ lead: e.target.value })}
            />
          </Field>
          <Field label="Reassure line">
            <input
              className={inputClassName()}
              value={university.reassure || ''}
              onChange={(e) => updateUniversity({ reassure: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Body paragraphs"
            items={university.body || []}
            onChange={(body) => updateUniversity({ body })}
            placeholder="Paragraph text"
            itemLabel="paragraph"
          />
          <Field label="Features section title">
            <input
              className={inputClassName()}
              value={university.featuresTitle || ''}
              onChange={(e) => updateUniversity({ featuresTitle: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Feature bullets"
            items={university.features || []}
            onChange={(features) => updateUniversity({ features })}
            placeholder="Feature text"
            itemLabel="feature"
          />
        </SectionCard>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-green-700">{message}</p>}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving || !isDirty}
            className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save page'}
          </button>
          <a
            href={`${PUBLIC_SITE_URL}/offers`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Open /offers preview
          </a>
        </div>
      </form>

      <StickySaveBar
        isDirty={isDirty}
        saving={saving}
        onSave={handleSave}
        lastSavedAt={lastSavedLabel}
        message={message}
        error={error}
      />
    </>
  )
}
