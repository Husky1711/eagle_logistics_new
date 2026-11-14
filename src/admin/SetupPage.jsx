import { useEffect, useState } from 'react'
import { ArrowRight, FolderLock, KeyRound, Lock, Mail, User } from 'lucide-react'
import { api } from './api'
import AuthShell, { AuthButton, AuthError, AuthField, PasswordStrength } from './AuthShell'

/** First run only: create the single admin account (needs ~/eagle-data/ALLOW_SETUP on the server). */
export default function SetupPage({ insecure, onDone }) {
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
  const mismatch = form.confirm && form.confirm !== form.password

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!/^[A-Za-z0-9._@-]{3,60}$/.test(form.username.trim())) {
      return setError('Username: 3–60 letters, numbers or . _ @ -')
    }
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
    <AuthShell
      title="Create your admin account"
      subtitle="One-time setup — this account manages offers on the website."
      insecure={insecure}
      footnote="Your password is stored encrypted and never shown again"
    >
      {allowed === null && <p className="text-sm text-ink-soft">Checking…</p>}

      {allowed === false && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="flex items-center gap-2 font-semibold">
            <FolderLock size={18} aria-hidden /> Setup is locked
          </p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>cPanel → File Manager → your home folder</li>
            <li>
              Open (or create) the folder <code className="rounded bg-white px-1.5 py-0.5">eagle-data</code>
            </li>
            <li>
              Create an empty file named <code className="rounded bg-white px-1.5 py-0.5">ALLOW_SETUP</code>
            </li>
            <li>Reload this page</li>
          </ol>
        </div>
      )}

      {allowed && (
        <form onSubmit={submit} noValidate className="space-y-5">
          <AuthField
            id="setup-username"
            icon={User}
            label="Admin username"
            value={form.username}
            onChange={set('username')}
            autoComplete="username"
            placeholder="e.g. eagleadmin"
            autoFocus
          />
          <AuthField
            id="setup-password"
            icon={Lock}
            label="Password"
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            placeholder="At least 10 characters"
            hint={<PasswordStrength value={form.password} />}
          />
          <AuthField
            id="setup-confirm"
            icon={KeyRound}
            label="Confirm password"
            type="password"
            value={form.confirm}
            onChange={set('confirm')}
            autoComplete="new-password"
            placeholder="Type it again"
            hint={mismatch ? <p className="text-xs font-medium text-red-600">Passwords don&apos;t match yet</p> : null}
          />
          <div className="border-t border-dashed border-neutral-200 pt-5">
            <AuthField
              id="setup-feedback"
              icon={Mail}
              label="Send website feedback to"
              type="email"
              value={form.feedbackTo}
              onChange={set('feedbackTo')}
              placeholder="you@gmail.com"
              hint={<p className="text-xs text-ink-soft">Messages from the Contact page form arrive here.</p>}
            />
          </div>
          <AuthError>{error}</AuthError>
          <AuthButton busy={busy} busyLabel="Creating account…">
            Create admin account
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
          </AuthButton>
        </form>
      )}
    </AuthShell>
  )
}
