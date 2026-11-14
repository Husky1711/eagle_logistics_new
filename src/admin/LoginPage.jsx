import { useState } from 'react'
import { Lock } from 'lucide-react'
import Input from '../components/common/Input'
import { api } from './api'
import InsecureBanner from './InsecureBanner'

export default function LoginPage({ insecure, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('Enter your username and password')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api.login(username.trim(), password)
      setPassword('')
      onLogin()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary-50">
      {insecure && <InsecureBanner />}
      <div className="flex min-h-[90vh] items-center justify-center px-4 py-10">
        <form
          onSubmit={submit}
          noValidate
          className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-7 shadow-soft"
        >
          <div className="text-center">
            <img src="/assets/brand/logo.png" alt="Eagle Logistics" className="mx-auto h-14 w-auto" />
            <h1 className="mt-4 font-display text-2xl font-bold text-heading">Admin login</h1>
            <p className="mt-1 text-sm text-ink">Manage offers on eaglelogistics.in</p>
          </div>

          <div className="mt-6 space-y-4">
            <Input
              label="Username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full justify-center">
            <Lock size={16} className="mr-2" aria-hidden />
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
          <p className="mt-4 text-center text-xs text-ink-soft">
            5 wrong attempts lock sign-in for 15 minutes.
          </p>
        </form>
      </div>
    </div>
  )
}
