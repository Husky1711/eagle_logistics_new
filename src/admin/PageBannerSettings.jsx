import { useEffect, useState } from 'react'
import Input from '../components/common/Input'
import { api } from './api'
import ImageField from './ImageField'

/** The big banner at the top of /offers. */
export default function PageBannerSettings({ onAuthLost }) {
  const [settings, setSettings] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .offers()
      .then((d) => setSettings({ heroImage: '', heroTitle: '', heroSubtitle: '', ...d.settings }))
      .catch((err) => (err.status === 401 ? onAuthLost() : setMessage({ type: 'error', text: err.message })))
  }, [onAuthLost])

  if (!settings) return <p className="text-ink">{message.text || 'Loading…'}</p>

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.value }))

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await api.saveSettings(settings)
      setSettings(res.settings)
      setMessage({ type: 'ok', text: 'Banner saved — it’s on the Offers page now.' })
    } catch (err) {
      if (err.status === 401) onAuthLost()
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-5" noValidate>
      <div>
        <h1 className="font-display text-2xl font-bold text-heading">Offers page banner</h1>
        <p className="mt-1 text-sm text-ink">The wide banner and heading at the top of the Offers page.</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-dark text-white">
        {settings.heroImage && <img src={settings.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/45 to-black/30" />
        <div className="relative px-6 py-10 text-center">
          <p className="font-display text-2xl font-bold sm:text-3xl">{settings.heroTitle || 'Banner heading'}</p>
          {settings.heroSubtitle && <p className="mt-2 text-white/95">{settings.heroSubtitle}</p>}
        </div>
      </div>

      <ImageField
        label="Banner image"
        value={settings.heroImage}
        onChange={(heroImage) => setSettings((s) => ({ ...s, heroImage }))}
        recommended={{ width: 1920, height: 480 }}
        help="Text sits on top in the middle, and phones crop the left and right sides — avoid text inside the image."
      />
      <Input label="Heading" value={settings.heroTitle} onChange={set('heroTitle')} maxLength={120} />
      <Input label="Sub-heading (optional)" value={settings.heroSubtitle} onChange={set('heroSubtitle')} maxLength={200} />

      {message.text && (
        <p
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Saving…' : 'Save banner'}
      </button>
    </form>
  )
}
