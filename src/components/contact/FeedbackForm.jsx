import { useId, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import Input from '../common/Input'
import Button from '../common/Button'
import { buildWhatsAppUrl } from '../../utils/whatsapp'

const TOPICS = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'enquiry', label: 'Shipping enquiry' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'other', label: 'Other' },
]

const empty = { name: '', email: '', phone: '', topic: 'feedback', message: '' }

export default function FeedbackForm({ whatsapp, email, copy = {} }) {
  const formId = useId()
  const [values, setValues] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

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

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

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
            'Your message is ready in WhatsApp. Send it to reach our Bangalore team.'}
        </p>
        <Button type="button" className="mt-5" onClick={() => setSent(false)}>
          {copy.sendAnother || 'Send another message'}
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft">
          {copy.helper || 'Opens WhatsApp with your message so our team can reply quickly.'}
        </p>
        <Button type="submit" className="w-full sm:w-auto">
          <Send className="mr-2 inline" size={16} aria-hidden />
          {copy.submitLabel || 'Send feedback'}
        </Button>
      </div>
    </form>
  )
}
