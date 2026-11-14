import { useState } from 'react'
import Input from '../components/common/Input'
import { api } from './api'

export default function AccountSettings() {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    if (form.next.length < 10) return setMessage({ type: 'error', text: 'New password must be at least 10 characters' })
    if (form.next !== form.confirm) return setMessage({ type: 'error', text: 'New passwords do not match' })
    setBusy(true)
    try {
      await api.changePassword(form.current, form.next)
      setForm({ current: '', next: '', confirm: '' })
      setMessage({ type: 'ok', text: 'Password changed.' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-md space-y-4" noValidate>
      <h1 className="font-display text-2xl font-bold text-heading">Change password</h1>
      <Input label="Current password" type="password" autoComplete="current-password" value={form.current} onChange={set('current')} />
      <Input label="New password (10+ characters)" type="password" autoComplete="new-password" value={form.next} onChange={set('next')} />
      <Input label="Confirm new password" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />
      {message.text && (
        <p
          role={message.type === 'error' ? 'alert' : 'status'}
          className={`rounded-lg px-3 py-2 text-sm ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}
        >
          {message.text}
        </p>
      )}
      <button type="submit" disabled={busy} className="btn-primary">
        {busy ? 'Saving…' : 'Change password'}
      </button>
    </form>
  )
}
