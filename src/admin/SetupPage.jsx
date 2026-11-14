import { useEffect, useState } from 'react'
import Input from '../components/common/Input'
import { api } from './api'

/** First run only: create the single admin account (needs ~/eagle-data/ALLOW_SETUP on the server). */
export default function SetupPage({ onDone }) {
  const [allowed, setAllowed] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', confirm: '', feedbackTo: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .setupStatus()
      .then((s) => setAllowed(s.allowed))
      .catch(() => setAllowed(false))
  }, [])

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 10) return setError('Password must be at least 10 characters')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    setBusy(true)
    try {
      await api.setup(form.username.trim(), form.password, form.feedbackTo.trim())
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-7 shadow-soft">
        <h1 className="font-display text-2xl font-bold text-heading">Set up the admin account</h1>
        {allowed === null && <p className="mt-3 text-sm text-ink">Checking…</p>}
        {allowed === false && (
          <div className="mt-3 space-y-2 text-sm text-ink">
            <p>Setup is locked. To unlock it once:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>cPanel → File Manager → your home folder</li>
              <li>Open (or create) the folder <code className="rounded bg-neutral-100 px-1">eagle-data</code></li>
              <li>
                Create an empty file named <code className="rounded bg-neutral-100 px-1">ALLOW_SETUP</code>
              </li>
              <li>Reload this page</li>
            </ol>
          </div>
        )}
        {allowed && (
          <form onSubmit={submit} noValidate className="mt-5 space-y-4">
            <Input label="Admin username" value={form.username} onChange={set('username')} autoComplete="username" required />
            <Input label="Password (10+ characters)" type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required />
            <Input label="Confirm password" type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" required />
            <Input
              label="Send website feedback to (email)"
              type="email"
              value={form.feedbackTo}
              onChange={set('feedbackTo')}
              placeholder="you@gmail.com"
            />
            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
              {busy ? 'Creating…' : 'Create admin account'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
