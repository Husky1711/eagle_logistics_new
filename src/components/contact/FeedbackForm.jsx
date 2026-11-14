import { useId, useState } from 'react'
import { AlertCircle, CheckCircle2, MessageCircle, Send } from 'lucide-react'
import Input from '../common/Input'
import Button from '../common/Button'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

const TOPICS = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'enquiry', label: 'Shipping enquiry' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
]

const empty = { name: '', email: '', phone: '', topic: 'feedback', message: '', website: '' }

export default function FeedbackForm({ whatsapp, email, copy = {} }) {
  const formId = useId()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')

  function update(field) {
    return (e) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      setErrors((err) => ({ ...err, [field]: undefined }))
    }
  }

  function validate() {
    const next = {}
    if (!values.name.trim()) next.name = 'Please enter your name'
    if (!values.email.trim()) next.email = 'Please enter your email'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = 'Please enter a valid email'
    }
    if (!values.message.trim()) next.message = 'Please enter your message'
    else if (values.message.trim().length < 10) next.message = 'Please write a bit more detail'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function buildMessage() {
    const topicLabel = TOPICS.find((t) => t.value === values.topic)?.label || values.topic
    return [
      'Hi Eagle Logistics, I have feedback from your website.',
      '',
      `Name: ${values.name.trim()}`,
      `Email: ${values.email.trim()}`,
      values.phone.trim() ? `Phone: ${values.phone.trim()}` : null,
      `Topic: ${topicLabel}`,
      '',
      values.message.trim(),
    ]
      .filter(Boolean)
      .join('\n')
  }

  /** Sends to public/api/feedback.php, which emails the team. */
  async function handleSubmit(e) {
    e.preventDefault()
    setSendError('')
    if (!validate()) return

    setSending(true)
    try {
      const res = await fetch('/api/feedback.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...values, name: values.name.trim(), email: values.email.trim() }),
      })
      const json = (res.headers.get('content-type') || '').includes('application/json') ? await res.json() : null
      if (res.ok && json?.ok) {
        setSent(true)
        setValues(empty)
        return
      }
      if (json?.fields) setErrors(json.fields)
      setSendError(json?.error || 'Could not send right now.')
    } catch {
      setSendError('Could not send right now.')
    } finally {
      setSending(false)
    }
  }

  /** Fallback when email sending isn't available: same message via WhatsApp / mail app. */
  function sendViaApp() {
    const text = buildMessage()
    const wa = buildWhatsAppUrl(whatsapp, text)
    if (wa) {
      window.open(wa, '_blank', 'noopener,noreferrer')
      setSent(true)
      setValues(empty)
      return
    }

    if (email) {
      const subject = encodeURIComponent(`Website feedback - ${values.topic}`)
      const body = encodeURIComponent(text)
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
      setSent(true)
      setValues(empty)
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-primary-200 bg-primary-50/60 px-6 py-10 text-center">
        <CheckCircle2 className="mx-auto text-primary-600" size={40} aria-hidden />
        <h3 className="mt-3 font-display text-xl font-semibold text-heading">
          {copy.successTitle || 'Thanks for your feedback'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink">
          {copy.successBody ||
            "Your message has reached our Bangalore team. We'll reply to your email soon."}
        </p>
        <Button type="button" className="mt-5" onClick={() => setSent(false)}>
          {copy.sendAnother || 'Send another message'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Honeypot: hidden from people, bots fill it in */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${formId}-name`}
          label={copy.nameLabel || 'Name'}
          name="name"
          autoComplete="name"
          value={values.name}
          onChange={update('name')}
          error={errors.name}
          required
        />
        <Input
          id={`${formId}-email`}
          label={copy.emailLabel || 'Email'}
          name="email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={update('email')}
          error={errors.email}
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          id={`${formId}-phone`}
          label={copy.phoneLabel || 'Phone (optional)'}
          name="phone"
          type="tel"
          autoComplete="tel"
          value={values.phone}
          onChange={update('phone')}
        />
        <div>
          <label htmlFor={`${formId}-topic`} className="mb-2 block text-sm font-medium text-ink">
            {copy.topicLabel || 'Topic'}
          </label>
          <select
            id={`${formId}-topic`}
            name="topic"
            value={values.topic}
            onChange={update('topic')}
            className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={`${formId}-message`} className="mb-2 block text-sm font-medium text-ink">
          {copy.messageLabel || 'Message'}
          <span className="ml-0.5 text-[#FC012E]" aria-hidden>
            *
          </span>
        </label>
        <textarea
          id={`${formId}-message`}
          name="message"
          rows={5}
          value={values.message}
          onChange={update('message')}
          className="w-full resize-y rounded-lg border border-neutral-300 px-4 py-3 text-neutral-900 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          placeholder={copy.messagePlaceholder || 'Tell us how we can help…'}
          required
        />
        {errors.message && <p className="mt-1 text-sm text-red-600">{errors.message}</p>}
      </div>

      {sendError && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" aria-hidden />
            {sendError}
          </span>
          {(whatsapp || email) && (
            <button type="button" onClick={sendViaApp} className="inline-flex shrink-0 items-center font-semibold text-red-900 underline">
              <MessageCircle size={16} className="mr-1.5" aria-hidden />
              Send via WhatsApp instead
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft">
          {copy.helper || 'Our team replies by email, usually within one working day.'}
        </p>
        <Button type="submit" className="w-full sm:w-auto" disabled={sending} aria-busy={sending}>
          <Send className="mr-2 inline" size={16} aria-hidden />
          {sending ? 'Sending…' : copy.submitLabel || 'Send feedback'}
        </Button>
      </div>
    </form>
  )
}
