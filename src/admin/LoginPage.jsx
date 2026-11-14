import { useState } from 'react'
import { ArrowRight, Lock, User } from 'lucide-react'
import { api } from './api'
import AuthShell, { AuthButton, AuthError, AuthField } from './AuthShell'

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
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage offers and prices on eaglelogistics.in"
      insecure={insecure}
      footnote="5 wrong attempts lock sign-in for 15 minutes"
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <AuthField
          id="admin-username"
          icon={User}
          label="Username"
          name="username"
          autoComplete="username"
          placeholder="Your admin username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <AuthField
          id="admin-password"
          icon={Lock}
          label="Password"
          type="password"
          name="password"
          autoComplete="current-password"
          placeholder="••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <AuthError>{error}</AuthError>
        <AuthButton busy={busy} busyLabel="Signing in…">
          Sign in
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </AuthButton>
      </form>
    </AuthShell>
  )
}
