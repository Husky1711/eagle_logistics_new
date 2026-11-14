import { useState } from 'react'
import { Calculator, CalendarClock, Eye, EyeOff, ShieldCheck, Tag } from 'lucide-react'
import InsecureBanner from './InsecureBanner'

const LOGO = '/assets/brand/logo.png'
const PHOTO = '/assets/home/slider-1.jpg'

const FEATURES = [
  { icon: Tag, title: 'Add & update offers', text: 'Prices, codes and destinations in a few clicks' },
  { icon: CalendarClock, title: 'Schedule automatically', text: 'Offers go live and expire on the dates you set' },
  { icon: Calculator, title: 'Control your pricing', text: 'Courier rates, discounts and your commission — kept private' },
]

/** Branded two-panel layout for the admin login and first-time setup. */
export default function AuthShell({ title, subtitle, insecure, children, footnote }) {
  return (
    <div className="min-h-screen bg-[#f3f7fb]">
      {insecure && <InsecureBanner />}
      <div className={`flex flex-col lg:flex-row ${insecure ? 'min-h-[calc(100vh-2.25rem)]' : 'min-h-screen'}`}>
        {/* Brand panel */}
        <aside className="relative overflow-hidden bg-primary-900 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
          <img src={PHOTO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/95 via-primary-800/90 to-primary-600/80" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#FC012E]/10 blur-3xl" />

          <div className="relative px-6 pb-16 pt-8 sm:px-10 lg:px-14 lg:pb-0 lg:pt-14">
            <div className="inline-flex rounded-2xl bg-white px-4 py-3 shadow-lg shadow-black/20">
              <img src={LOGO} alt="Eagle Logistics & Express Services" className="h-10 w-auto sm:h-12" />
            </div>
            <h2 className="mt-8 hidden font-display text-3xl font-bold leading-tight !text-white xl:text-4xl lg:block">
              Offers & prices,
              <br />
              <span className="text-[#7fd0f5]">live in minutes.</span>
            </h2>
            <p className="mt-3 hidden max-w-sm text-base text-white/75 lg:block">
              The admin for eaglelogistics.in — update offers and courier prices without touching code.
            </p>
          </div>

          <ul className="relative hidden space-y-5 px-14 lg:block">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <Icon size={20} aria-hidden />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="text-sm text-white/65">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          <p className="relative hidden items-center gap-2 px-14 pb-10 text-xs text-white/55 lg:flex">
            <ShieldCheck size={14} aria-hidden />
            Eagle Logistics &amp; Express Services · Bangalore
          </p>
        </aside>

        {/* Form panel */}
        <main className="relative flex flex-1 items-start justify-center px-4 pb-12 lg:items-center lg:px-10 lg:py-12">
          <div className="-mt-10 w-full max-w-[440px] lg:mt-0">
            <div className="rounded-3xl border border-white bg-white p-7 shadow-[0_20px_60px_-15px_rgba(10,51,82,0.25)] sm:p-9">
              <h1 className="font-display text-[1.75rem] font-bold leading-tight text-primary-900">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm text-ink-soft">{subtitle}</p>}
              <div className="mt-7">{children}</div>
            </div>
            {footnote && (
              <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-ink-soft">
                <ShieldCheck size={14} className="shrink-0 text-primary-500" aria-hidden />
                {footnote}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/** Text input with a leading icon; password fields get a show/hide toggle. */
export function AuthField({ icon: Icon, label, type = 'text', id, hint, ...props }) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-primary-900">
        {label}
      </label>
      <div className="group relative">
        <Icon
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors group-focus-within:text-primary-500"
          aria-hidden
        />
        <input
          id={id}
          type={isPassword && visible ? 'text' : type}
          className={`w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-3 pl-11 text-[15px] text-neutral-900 transition placeholder:text-neutral-400 hover:border-neutral-300 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/15 ${
            isPassword ? 'pr-11' : 'pr-4'
          }`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hint && <div className="mt-1.5">{hint}</div>}
    </div>
  )
}

/** Simple strength meter: length + variety. */
export function PasswordStrength({ value }) {
  if (!value) return <p className="text-xs text-ink-soft">At least 10 characters. Mix letters, numbers and symbols.</p>
  let score = 0
  if (value.length >= 10) score++
  if (value.length >= 14) score++
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score++
  if (/\d/.test(value)) score++
  if (/[^A-Za-z0-9]/.test(value)) score++
  const level = value.length < 10 ? 0 : score <= 2 ? 1 : score <= 3 ? 2 : 3
  const labels = ['Too short', 'Weak', 'Good', 'Strong']
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-primary-500', 'bg-green-500']
  return (
    <div className="flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= level ? colors[level] : 'bg-neutral-200'}`} />
        ))}
      </div>
      <span className="w-16 text-right text-xs font-semibold text-ink-soft">{labels[level]}</span>
    </div>
  )
}

export function AuthError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
      {children}
    </p>
  )
}

export function AuthButton({ busy, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3.5 font-semibold text-white shadow-lg shadow-primary-500/30 transition hover:from-primary-700 hover:to-primary-600 focus:outline-none focus:ring-4 focus:ring-primary-500/30 disabled:cursor-wait disabled:opacity-70"
    >
      {busy ? busyLabel : children}
    </button>
  )
}
