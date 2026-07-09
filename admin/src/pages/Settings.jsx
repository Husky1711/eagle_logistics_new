import { useEffect, useState } from 'react'
import { api } from '../api/client'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-neutral-700">{label}</span>
      {children}
    </label>
  )
}

function inputClassName() {
  return 'w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm'
}

function NavListEditor({ title, items, onChange }) {
  const updateItem = (index, key, value) => {
    const next = items.map((item, i) => (i === index ? { ...item, [key]: value } : item))
    onChange(next)
  }

  const addItem = () => onChange([...items, { path: '/', label: 'New link' }])
  const removeItem = (index) => onChange(items.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-dark">{title}</h3>
        <button type="button" onClick={addItem} className="text-sm font-medium text-primary-600">
          + Add link
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="grid gap-2 rounded-lg border border-neutral-200 p-3 md:grid-cols-[1fr_1fr_auto]">
          <input
            className={inputClassName()}
            value={item.label}
            onChange={(e) => updateItem(index, 'label', e.target.value)}
            placeholder="Label"
          />
          <input
            className={inputClassName()}
            value={item.path}
            onChange={(e) => updateItem(index, 'path', e.target.value)}
            placeholder="/path"
          />
          <button type="button" onClick={() => removeItem(index)} className="text-sm text-red-600">
            Remove
          </button>
        </div>
      ))}
    </div>
  )
}

export default function Settings() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getSettings()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await api.updateSettings(data)
      setData(updated)
      setMessage('Settings saved and synced to public site.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-neutral-600">Loading settings…</p>
  if (!data) return <p className="text-red-600">{error || 'Failed to load settings'}</p>

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-dark">Site settings</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Map embed HTML is managed in Sprint 3. Contact edits here update URL and details only.
        </p>
      </div>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <h2 className="font-semibold">Site</h2>
        <Field label="Name">
          <input
            className={inputClassName()}
            value={data.site.name}
            onChange={(e) => setData({ ...data, site: { ...data.site, name: e.target.value } })}
          />
        </Field>
        <Field label="Tagline">
          <input
            className={inputClassName()}
            value={data.site.tagline}
            onChange={(e) => setData({ ...data, site: { ...data.site, tagline: e.target.value } })}
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClassName()}
            rows={3}
            value={data.site.description}
            onChange={(e) => setData({ ...data, site: { ...data.site, description: e.target.value } })}
          />
        </Field>
      </section>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <h2 className="font-semibold">Header</h2>
        <Field label="Logo path">
          <input
            className={inputClassName()}
            value={data.header.logo}
            onChange={(e) => setData({ ...data, header: { ...data.header, logo: e.target.value } })}
          />
        </Field>
        <NavListEditor
          title="Menu items"
          items={data.header.menuItems}
          onChange={(menuItems) => setData({ ...data, header: { ...data.header, menuItems } })}
        />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="CTA text">
            <input
              className={inputClassName()}
              value={data.header.ctaButton.text}
              onChange={(e) =>
                setData({
                  ...data,
                  header: { ...data.header, ctaButton: { ...data.header.ctaButton, text: e.target.value } },
                })
              }
            />
          </Field>
          <Field label="CTA URL">
            <input
              className={inputClassName()}
              value={data.header.ctaButton.url}
              onChange={(e) =>
                setData({
                  ...data,
                  header: { ...data.header, ctaButton: { ...data.header.ctaButton, url: e.target.value } },
                })
              }
            />
          </Field>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              checked={data.header.ctaButton.enabled}
              onChange={(e) =>
                setData({
                  ...data,
                  header: { ...data.header, ctaButton: { ...data.header.ctaButton, enabled: e.target.checked } },
                })
              }
            />
            CTA enabled
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <h2 className="font-semibold">Footer</h2>
        <Field label="Description">
          <textarea
            className={inputClassName()}
            rows={3}
            value={data.footer.description}
            onChange={(e) => setData({ ...data, footer: { ...data.footer, description: e.target.value } })}
          />
        </Field>
        <NavListEditor
          title="Quick links"
          items={data.footer.quickLinks}
          onChange={(quickLinks) => setData({ ...data, footer: { ...data.footer, quickLinks } })}
        />
        <NavListEditor
          title="Support links"
          items={data.footer.supportLinks}
          onChange={(supportLinks) => setData({ ...data, footer: { ...data.footer, supportLinks } })}
        />
      </section>

      <section className="space-y-4 rounded-xl bg-white p-6 shadow-soft">
        <h2 className="font-semibold">Contact</h2>
        <Field label="Address">
          <textarea className={inputClassName()} rows={2} value={data.contact.address} onChange={(e) => setData({ ...data, contact: { ...data.contact, address: e.target.value } })} />
        </Field>
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Phone">
            <input className={inputClassName()} value={data.contact.phone} onChange={(e) => setData({ ...data, contact: { ...data.contact, phone: e.target.value } })} />
          </Field>
          <Field label="WhatsApp">
            <input className={inputClassName()} value={data.contact.whatsapp} onChange={(e) => setData({ ...data, contact: { ...data.contact, whatsapp: e.target.value } })} />
          </Field>
          <Field label="Email">
            <input className={inputClassName()} value={data.contact.email} onChange={(e) => setData({ ...data, contact: { ...data.contact, email: e.target.value } })} />
          </Field>
          <Field label="Hours">
            <input className={inputClassName()} value={data.contact.hours} onChange={(e) => setData({ ...data, contact: { ...data.contact, hours: e.target.value } })} />
          </Field>
        </div>
        <Field label="Google Maps URL">
          <input className={inputClassName()} value={data.contact.googleMapsUrl} onChange={(e) => setData({ ...data, contact: { ...data.contact, googleMapsUrl: e.target.value } })} />
        </Field>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary-500 px-5 py-2.5 font-semibold text-white hover:bg-primary-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save settings'}
      </button>
    </form>
  )
}
