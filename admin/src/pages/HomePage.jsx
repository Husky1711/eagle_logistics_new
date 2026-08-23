import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { PUBLIC_SITE_URL } from '../config/publicSite'
import ConfirmDialog from '../components/ConfirmDialog'
import CollapsibleSectionCard from '../components/CollapsibleSectionCard'
import HomeAssetField from '../components/HomeAssetField'
import SectionNav from '../components/SectionNav'
import StickySaveBar from '../components/StickySaveBar'
import useUnsavedChangesGuard from '../hooks/useUnsavedChangesGuard'
import { HOME_SECTIONS, useHomeSectionCollapse } from '../hooks/useHomeSectionCollapse'
import { formatSavedAt } from '../utils/formatSavedAt'

function Field({ label, hint, children, subdued = false }) {
  return (
    <label className={`block ${subdued ? 'rounded-lg border border-dashed border-neutral-200 bg-neutral-50/80 p-3' : ''}`}>
      <span className={`mb-1.5 block text-sm font-medium ${subdued ? 'text-neutral-600' : 'text-neutral-700'}`}>
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

function ReadOnlyField({ label, value, hint }) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">{label}</span>
      <input
        readOnly
        disabled
        className={`${inputClassName()} cursor-not-allowed bg-neutral-100 text-neutral-600`}
        value={value || ''}
      />
      {hint ? <span className="mt-1.5 block text-xs text-neutral-500">{hint}</span> : null}
    </div>
  )
}

function ReadOnlyLinkPath({ pathPrefix, slug }) {
  const path = slug ? `${pathPrefix}${slug}` : ''
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-neutral-700">Link path (read-only)</span>
      <input
        readOnly
        disabled
        className={`${inputClassName()} cursor-not-allowed bg-neutral-100 text-neutral-600`}
        value={path}
      />
    </div>
  )
}

function HeroCarouselEditor({ slides, onChange }) {
  const updateSlide = (index, value) => {
    const next = [...slides]
    next[index] = value
    onChange(next)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {(slides || []).map((slide, index) => (
        <HomeAssetField
          key={index}
          label={`Slide ${index + 1}`}
          value={slide || ''}
          onChange={(value) => updateSlide(index, value)}
          alt={`Hero slide ${index + 1}`}
          layout="inline"
        />
      ))}
    </div>
  )
}

function ServiceCardsEditor({ cards, onChange }) {
  const updateCard = (index, patch) => {
    onChange(cards.map((card, i) => (i === index ? { ...card, ...patch } : card)))
  }

  return (
    <div className="space-y-4">
      {cards.map((card, index) => (
        <div key={card.id || index} className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-dark">{card.title || `Service card ${index + 1}`}</p>
          <ReadOnlyField label="Card id (read-only)" value={card.id} hint="Internal identifier for this card." />
          <Field label="Title">
            <input
              className={inputClassName()}
              value={card.title || ''}
              onChange={(e) => updateCard(index, { title: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={inputClassName()}
              rows={3}
              value={card.body || ''}
              onChange={(e) => updateCard(index, { body: e.target.value })}
            />
          </Field>
          <HomeAssetField
            label="Image"
            value={card.image || ''}
            onChange={(image) => updateCard(index, { image })}
            alt={card.title}
            layout="inline"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Link label">
              <input
                className={inputClassName()}
                value={card.linkLabel || ''}
                onChange={(e) => updateCard(index, { linkLabel: e.target.value })}
              />
            </Field>
            <Field label="Link URL">
              <input
                className={inputClassName()}
                value={card.link || ''}
                onChange={(e) => updateCard(index, { link: e.target.value })}
              />
            </Field>
          </div>
        </div>
      ))}
    </div>
  )
}

function AdvantagesEditor({ advantages, onChange }) {
  const updateItem = (index, patch) => {
    const items = advantages.items || []
    onChange({
      ...advantages,
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Section title">
        <input
          className={inputClassName()}
          value={advantages.title || ''}
          onChange={(e) => onChange({ ...advantages, title: e.target.value })}
        />
      </Field>
      {(advantages.items || []).map((item, index) => (
        <div key={item.id || index} className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <ReadOnlyField label="Item id (read-only)" value={item.id} />
          <Field label="Text">
            <input
              className={inputClassName()}
              value={item.text || ''}
              onChange={(e) => updateItem(index, { text: e.target.value })}
            />
          </Field>
          <Field label="Link URL">
            <input
              className={inputClassName()}
              value={item.link || ''}
              onChange={(e) => updateItem(index, { link: e.target.value })}
            />
          </Field>
          <HomeAssetField
            label="Icon image"
            value={item.iconImage || ''}
            onChange={(iconImage) => updateItem(index, { iconImage })}
            alt=""
            layout="inline"
          />
        </div>
      ))}
    </div>
  )
}

function PopularItemsEditor({ popularItems, onChange }) {
  const updateItem = (index, patch) => {
    const items = popularItems.items || []
    onChange({
      ...popularItems,
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Section title">
        <input
          className={inputClassName()}
          value={popularItems.title || ''}
          onChange={(e) => onChange({ ...popularItems, title: e.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="View all link text">
          <input
            className={inputClassName()}
            value={popularItems.viewAllLabel || ''}
            onChange={(e) => onChange({ ...popularItems, viewAllLabel: e.target.value })}
          />
        </Field>
        <Field label="View all link URL">
          <input
            className={inputClassName()}
            value={popularItems.viewAllLink || ''}
            onChange={(e) => onChange({ ...popularItems, viewAllLink: e.target.value })}
          />
        </Field>
      </div>
      <p className="text-xs text-amber-700">
        Do not change link paths here — wrong slugs break tile links. Ask a developer to rename routes.
      </p>
      {(popularItems.items || []).map((item, index) => (
        <div key={item.id || index} className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <Field label="Tile title">
            <input
              className={inputClassName()}
              value={item.title || ''}
              onChange={(e) => updateItem(index, { title: e.target.value })}
            />
          </Field>
          <ReadOnlyLinkPath pathPrefix="/things-we-send/" slug={item.slug} />
          <HomeAssetField
            label="Tile image"
            value={item.image || ''}
            onChange={(image) => updateItem(index, { image })}
            alt={item.title}
            layout="inline"
          />
        </div>
      ))}
    </div>
  )
}

function CargoEditor({ cargo, onChange }) {
  const updateItem = (index, patch) => {
    const items = cargo.items || []
    onChange({
      ...cargo,
      items: items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    })
  }

  return (
    <div className="space-y-4">
      <Field label="Section title">
        <input
          className={inputClassName()}
          value={cargo.title || ''}
          onChange={(e) => onChange({ ...cargo, title: e.target.value })}
        />
      </Field>
      <p className="text-xs text-amber-700">
        Do not change link paths here — wrong slugs break cargo page links. Ask a developer to rename routes.
      </p>
      {(cargo.items || []).map((item, index) => (
        <div key={item.id || index} className="space-y-3 rounded-lg border border-neutral-200 p-4">
          <Field label="Title">
            <input
              className={inputClassName()}
              value={item.title || ''}
              onChange={(e) => updateItem(index, { title: e.target.value })}
            />
          </Field>
          <Field label="Summary">
            <textarea
              className={inputClassName()}
              rows={2}
              value={item.summary || ''}
              onChange={(e) => updateItem(index, { summary: e.target.value })}
            />
          </Field>
          <ReadOnlyLinkPath pathPrefix="/cargo/" slug={item.slug} />
          <HomeAssetField
            label="Tile image"
            value={item.image || ''}
            onChange={(image) => updateItem(index, { image })}
            alt={item.title}
            layout="inline"
          />
        </div>
      ))}
    </div>
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

function TestimonialsEditor({ title, items, onTitleChange, onItemsChange }) {
  const [removeIndex, setRemoveIndex] = useState(null)

  const updateItem = (index, patch) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    onItemsChange(next)
  }

  const addItem = () => {
    const nextId = items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    onItemsChange([...items, { id: nextId, quote: '', name: '', location: '' }])
  }

  const confirmRemove = () => {
    if (removeIndex === null) return
    onItemsChange(items.filter((_, i) => i !== removeIndex))
    setRemoveIndex(null)
  }

  const pending = removeIndex !== null ? items[removeIndex] : null

  return (
    <div className="space-y-4">
      <Field label="Section title">
        <input className={inputClassName()} value={title || ''} onChange={(e) => onTitleChange(e.target.value)} />
      </Field>
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-neutral-700">Customer quotes</p>
          <button
            type="button"
            onClick={addItem}
            className="rounded-lg border border-neutral-300 px-2.5 py-1 text-xs font-medium hover:bg-neutral-50"
          >
            + Add quote
          </button>
        </div>
        <div className="space-y-4">
          {items.length === 0 ? (
            <p className="text-sm text-neutral-500">No testimonials yet.</p>
          ) : (
            items.map((item, index) => (
              <div key={item.id ?? index} className="space-y-3 rounded-lg border border-neutral-200 p-4">
                <textarea
                  className={inputClassName()}
                  rows={3}
                  value={item.quote || ''}
                  placeholder="Quote text"
                  onChange={(e) => updateItem(index, { quote: e.target.value })}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className={inputClassName()}
                    value={item.name || ''}
                    placeholder="Customer name"
                    onChange={(e) => updateItem(index, { name: e.target.value })}
                  />
                  <input
                    className={inputClassName()}
                    value={item.location || ''}
                    placeholder="Location"
                    onChange={(e) => updateItem(index, { location: e.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveIndex(index)}
                  className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                >
                  Remove quote
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      <ConfirmDialog
        open={removeIndex !== null}
        title="Remove testimonial?"
        message={
          pending?.quote?.trim()
            ? `Remove the quote from ${pending.name || 'this customer'}? You can undo by not saving.`
            : 'Remove this empty testimonial?'
        }
        confirmLabel="Remove"
        onConfirm={confirmRemove}
        onCancel={() => setRemoveIndex(null)}
        danger
      />
    </div>
  )
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value
}

function buildCleanPayload(data) {
  const content = data.content || {}
  return {
    ...data,
    content: {
      ...content,
      mission: {
        ...content.mission,
        image: trimString(content.mission?.image),
        imageAlt: trimString(content.mission?.imageAlt),
        items: (content.mission?.items || []).map((line) => line.trim()).filter(Boolean),
      },
      heroImages: (content.heroImages || []).map((path) => trimString(path)).filter(Boolean),
      serviceCards: (content.serviceCards || []).map((card) => ({
        ...card,
        title: trimString(card.title),
        body: trimString(card.body),
        image: trimString(card.image),
        link: trimString(card.link),
        linkLabel: trimString(card.linkLabel),
      })),
      advantages: {
        ...content.advantages,
        title: trimString(content.advantages?.title),
        items: (content.advantages?.items || []).map((item) => ({
          ...item,
          text: trimString(item.text),
          link: trimString(item.link),
          iconImage: trimString(item.iconImage),
        })),
      },
      popularItems: {
        ...content.popularItems,
        title: trimString(content.popularItems?.title),
        viewAllLabel: trimString(content.popularItems?.viewAllLabel),
        viewAllLink: trimString(content.popularItems?.viewAllLink),
        items: (content.popularItems?.items || []).map((item) => ({
          ...item,
          title: trimString(item.title),
          image: trimString(item.image),
        })),
      },
      cargo: {
        ...content.cargo,
        title: trimString(content.cargo?.title),
        items: (content.cargo?.items || []).map((item) => ({
          ...item,
          title: trimString(item.title),
          summary: trimString(item.summary),
          image: trimString(item.image),
        })),
      },
      testimonials: {
        ...content.testimonials,
        items: (content.testimonials?.items || [])
          .map((item) => ({
            ...item,
            quote: (item.quote || '').trim(),
            name: (item.name || '').trim(),
            location: (item.location || '').trim(),
          }))
          .filter((item) => item.quote),
      },
    },
  }
}

export default function HomePage() {
  const [data, setData] = useState(null)
  const [savedSnapshot, setSavedSnapshot] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.getHomePage(), api.getMeta()])
      .then(([page, meta]) => {
        setData(page)
        setSavedSnapshot(JSON.stringify(page))
        setLastSavedAt(meta.home_page_saved_at)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const isDirty = useMemo(() => {
    if (!data || savedSnapshot === null) return false
    return JSON.stringify(data) !== savedSnapshot
  }, [data, savedSnapshot])

  useUnsavedChangesGuard(isDirty)
  const { openSections, setSectionOpen, navigateToSection } = useHomeSectionCollapse()

  const touch = () => setMessage('')

  const updateMeta = (patch) => {
    touch()
    setData((current) => ({ ...current, meta: { ...current.meta, ...patch } }))
  }

  const updateHero = (patch) => {
    touch()
    setData((current) => ({
      ...current,
      content: { ...current.content, hero: { ...current.content.hero, ...patch } },
    }))
  }

  const updateHeroImages = (heroImages) => {
    touch()
    setData((current) => ({ ...current, content: { ...current.content, heroImages } }))
  }

  const updateIntro = (patch) => {
    touch()
    setData((current) => ({
      ...current,
      content: { ...current.content, intro: { ...current.content.intro, ...patch } },
    }))
  }

  const updateMission = (patch) => {
    touch()
    setData((current) => ({
      ...current,
      content: { ...current.content, mission: { ...current.content.mission, ...patch } },
    }))
  }

  const updateTestimonials = (patch) => {
    touch()
    setData((current) => ({
      ...current,
      content: {
        ...current.content,
        testimonials: { ...current.content.testimonials, ...patch },
      },
    }))
  }

  const updateCta = (patch) => {
    touch()
    setData((current) => ({
      ...current,
      content: { ...current.content, cta: { ...current.content.cta, ...patch } },
    }))
  }

  const updateServiceCards = (serviceCards) => {
    touch()
    setData((current) => ({ ...current, content: { ...current.content, serviceCards } }))
  }

  const updateAdvantages = (advantages) => {
    touch()
    setData((current) => ({ ...current, content: { ...current.content, advantages } }))
  }

  const updatePopularItems = (popularItems) => {
    touch()
    setData((current) => ({ ...current, content: { ...current.content, popularItems } }))
  }

  const updateCargo = (cargo) => {
    touch()
    setData((current) => ({ ...current, content: { ...current.content, cargo } }))
  }

  const handleSave = async (event) => {
    event?.preventDefault()
    if (!data || saving) return

    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await api.updateHomePage(buildCleanPayload(data))
      setData(updated)
      setSavedSnapshot(JSON.stringify(updated))
      const meta = await api.getMeta()
      setLastSavedAt(meta.home_page_saved_at)
      setMessage('Home page saved and synced to the public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading Home page…</p>
  if (!data) return <p className="text-red-600">{error || 'Failed to load Home page'}</p>

  const meta = data.meta || {}
  const hero = data.content?.hero || {}
  const heroImages = data.content?.heroImages || []
  const intro = data.content?.intro || {}
  const mission = data.content?.mission || {}
  const testimonials = data.content?.testimonials || {}
  const serviceCards = data.content?.serviceCards || []
  const advantages = data.content?.advantages || {}
  const popularItems = data.content?.popularItems || {}
  const cargo = data.content?.cargo || {}
  const cta = data.content?.cta || {}
  const lastSavedLabel = formatSavedAt(lastSavedAt)

  const sectionSummaries = {
    'home-hero-text': hero.headline || hero.brand || 'No headline',
    'home-hero-carousel': `${(heroImages || []).filter(Boolean).length} slides`,
    'home-seo': meta.title || 'Optional — for Google & social sharing',
    'home-intro': intro.sectionTitle || 'Intro section',
    'home-mission': mission.title || `${(mission.items || []).length} bullets`,
    'home-service-cards': `${serviceCards.length} cards`,
    'home-advantages': `${(advantages.items || []).length} tiles · ${advantages.title || 'Advantages'}`,
    'home-popular-items': `${(popularItems.items || []).length} tiles · ${popularItems.title || 'Popular items'}`,
    'home-testimonials': `${(testimonials.items || []).length} quotes`,
    'home-cargo': `${(cargo.items || []).length} tiles · ${cargo.title || 'Cargo'}`,
    'home-cta': cta.title || 'Bottom call to action',
  }

  return (
    <>
      <form onSubmit={handleSave} className={`space-y-6 ${isDirty ? 'pb-24' : ''}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-dark">Home page</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Edit the main <code className="text-xs">/</code> landing page — text, images, and carousel slides.
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
              href={PUBLIC_SITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Preview home ↗
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

        <SectionNav sections={HOME_SECTIONS} onNavigate={navigateToSection} />

        <CollapsibleSectionCard
          id="home-hero-text"
          title="Hero text"
          description="Text over the image carousel. The Track Shipment button stays fixed for now."
          summary={sectionSummaries['home-hero-text']}
          open={openSections['home-hero-text']}
          onOpenChange={(open) => setSectionOpen('home-hero-text', open)}
        >
          <Field label="Brand label" hint="Small text above the main headline.">
            <input
              className={inputClassName()}
              value={hero.brand || ''}
              onChange={(e) => updateHero({ brand: e.target.value })}
            />
          </Field>
          <Field label="Main headline">
            <input
              className={inputClassName()}
              value={hero.headline || ''}
              onChange={(e) => updateHero({ headline: e.target.value })}
            />
          </Field>
          <Field label="Subheadline">
            <textarea
              className={inputClassName()}
              rows={2}
              value={hero.subheadline || ''}
              onChange={(e) => updateHero({ subheadline: e.target.value })}
            />
          </Field>
          <Field
            label="Promo strip (bottom of hero)"
            hint="Blue bar on the home hero only — not the sitewide Homepage offer strip."
          >
            <input
              className={inputClassName()}
              value={hero.promo || ''}
              onChange={(e) => updateHero({ promo: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button text">
              <input
                className={inputClassName()}
                value={hero.cta || ''}
                onChange={(e) => updateHero({ cta: e.target.value })}
              />
            </Field>
            <Field label="Primary button link" hint="Internal path like /pricing">
              <input
                className={inputClassName()}
                value={hero.ctaLink || ''}
                onChange={(e) => updateHero({ ctaLink: e.target.value })}
              />
            </Field>
          </div>
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-hero-carousel"
          title="Hero carousel"
          description="Five background images rotating behind the hero text."
          summary={sectionSummaries['home-hero-carousel']}
          open={openSections['home-hero-carousel']}
          onOpenChange={(open) => setSectionOpen('home-hero-carousel', open)}
        >
          <HeroCarouselEditor slides={heroImages} onChange={updateHeroImages} />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-seo"
          title="Google & social (SEO)"
          description="Optional — for Google search and social sharing previews."
          summary={sectionSummaries['home-seo']}
          open={openSections['home-seo']}
          onOpenChange={(open) => setSectionOpen('home-seo', open)}
        >
          <Field label="Page title (SEO)">
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
            hint="Optional. Path like /assets/home/international.jpg for Facebook/WhatsApp previews."
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
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-intro"
          title="Why ship with Eagle"
          description="Intro section below the hero."
          summary={sectionSummaries['home-intro']}
          open={openSections['home-intro']}
          onOpenChange={(open) => setSectionOpen('home-intro', open)}
        >
          <Field label="Section title">
            <input
              className={inputClassName()}
              value={intro.sectionTitle || ''}
              onChange={(e) => updateIntro({ sectionTitle: e.target.value })}
            />
          </Field>
          <Field label="Body paragraph">
            <textarea
              className={inputClassName()}
              rows={5}
              value={intro.body || ''}
              onChange={(e) => updateIntro({ body: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Read more link text">
              <input
                className={inputClassName()}
                value={intro.readMoreLabel || ''}
                onChange={(e) => updateIntro({ readMoreLabel: e.target.value })}
              />
            </Field>
            <Field label="Read more link URL">
              <input
                className={inputClassName()}
                value={intro.readMoreLink || ''}
                onChange={(e) => updateIntro({ readMoreLink: e.target.value })}
              />
            </Field>
          </div>
          <Field
            subdued
            label="Fallback headline (only if hero headline is empty)"
            hint="Rarely used. The public page shows this only when the main hero headline above is blank."
          >
            <input
              className={inputClassName()}
              value={intro.title || ''}
              onChange={(e) => updateIntro({ title: e.target.value })}
            />
          </Field>
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-mission"
          title="Our mission"
          description="Mission image and bullet list beside it on the home page."
          summary={sectionSummaries['home-mission']}
          open={openSections['home-mission']}
          onOpenChange={(open) => setSectionOpen('home-mission', open)}
        >
          <Field label="Section title">
            <input
              className={inputClassName()}
              value={mission.title || ''}
              onChange={(e) => updateMission({ title: e.target.value })}
            />
          </Field>
          <HomeAssetField
            label="Mission image"
            value={mission.image || ''}
            onChange={(image) => updateMission({ image })}
            alt={mission.imageAlt || mission.title}
            layout="inline"
          />
          <Field label="Mission image alt text">
            <input
              className={inputClassName()}
              value={mission.imageAlt || ''}
              onChange={(e) => updateMission({ imageAlt: e.target.value })}
            />
          </Field>
          <ListEditor
            label="Mission bullets"
            items={mission.items || []}
            onChange={(items) => updateMission({ items })}
            placeholder="Mission point"
            itemLabel="bullet"
          />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-service-cards"
          title="Domestic & international cards"
          description="Two large service cards below the mission section."
          summary={sectionSummaries['home-service-cards']}
          open={openSections['home-service-cards']}
          onOpenChange={(open) => setSectionOpen('home-service-cards', open)}
        >
          <ServiceCardsEditor cards={serviceCards} onChange={updateServiceCards} />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-advantages"
          title="Advantages"
          description="Five linked advantage tiles with icons."
          summary={sectionSummaries['home-advantages']}
          open={openSections['home-advantages']}
          onOpenChange={(open) => setSectionOpen('home-advantages', open)}
        >
          <AdvantagesEditor advantages={advantages} onChange={updateAdvantages} />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-popular-items"
          title="Most popular items"
          description="Eight category tiles linking to Things We Send pages."
          summary={sectionSummaries['home-popular-items']}
          open={openSections['home-popular-items']}
          onOpenChange={(open) => setSectionOpen('home-popular-items', open)}
        >
          <PopularItemsEditor popularItems={popularItems} onChange={updatePopularItems} />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-testimonials"
          title="What customers say"
          description="Testimonial quotes on the dark band."
          summary={sectionSummaries['home-testimonials']}
          open={openSections['home-testimonials']}
          onOpenChange={(open) => setSectionOpen('home-testimonials', open)}
        >
          <TestimonialsEditor
            title={testimonials.title}
            items={testimonials.items || []}
            onTitleChange={(title) => updateTestimonials({ title })}
            onItemsChange={(items) => updateTestimonials({ items })}
          />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-cargo"
          title="Cargo services"
          description="Air, sea, and surface cargo tiles."
          summary={sectionSummaries['home-cargo']}
          open={openSections['home-cargo']}
          onOpenChange={(open) => setSectionOpen('home-cargo', open)}
        >
          <CargoEditor cargo={cargo} onChange={updateCargo} />
        </CollapsibleSectionCard>

        <CollapsibleSectionCard
          id="home-cta"
          title="Bottom call to action"
          description="Final band before the footer."
          summary={sectionSummaries['home-cta']}
          open={openSections['home-cta']}
          onOpenChange={(open) => setSectionOpen('home-cta', open)}
        >
          <Field label="Title">
            <input
              className={inputClassName()}
              value={cta.title || ''}
              onChange={(e) => updateCta({ title: e.target.value })}
            />
          </Field>
          <Field label="Subtitle">
            <textarea
              className={inputClassName()}
              rows={2}
              value={cta.subtitle || ''}
              onChange={(e) => updateCta({ subtitle: e.target.value })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary button text">
              <input
                className={inputClassName()}
                value={cta.button || ''}
                onChange={(e) => updateCta({ button: e.target.value })}
              />
            </Field>
            <Field label="Primary button link">
              <input
                className={inputClassName()}
                value={cta.buttonLink || ''}
                onChange={(e) => updateCta({ buttonLink: e.target.value })}
              />
            </Field>
            <Field label="Secondary button text">
              <input
                className={inputClassName()}
                value={cta.secondaryButton || ''}
                onChange={(e) => updateCta({ secondaryButton: e.target.value })}
              />
            </Field>
            <Field label="Secondary button link">
              <input
                className={inputClassName()}
                value={cta.secondaryButtonLink || ''}
                onChange={(e) => updateCta({ secondaryButtonLink: e.target.value })}
              />
            </Field>
          </div>
        </CollapsibleSectionCard>

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
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary-600 hover:underline"
          >
            Open home preview
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
