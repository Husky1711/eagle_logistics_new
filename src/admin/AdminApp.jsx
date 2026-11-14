import { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ExternalLink, Image as ImageIcon, KeyRound, LogOut, ShieldAlert, Tag } from 'lucide-react'
import { api } from './api'
import LoginPage from './LoginPage'
import SetupPage from './SetupPage'
import OffersManager from './OffersManager'
import PageBannerSettings from './PageBannerSettings'
import AccountSettings from './AccountSettings'
import InsecureBanner from './InsecureBanner'

const TABS = [
  { id: 'offers', label: 'Offers', icon: Tag },
  { id: 'banner', label: 'Offers page banner', icon: ImageIcon },
  { id: 'account', label: 'Password', icon: KeyRound },
]

/** /admin — one login, then manage offers. Talks to public/api/*.php */
export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('offers')

  const refresh = useCallback(() => {
    setError('')
    return api
      .session()
      .then(setSession)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function logout() {
    try {
      await api.logout()
    } finally {
      refresh()
    }
  }

  let body
  if (error) {
    body = (
      <Centered>
        <ShieldAlert className="mx-auto text-red-600" size={36} aria-hidden />
        <p className="mt-3 font-semibold text-heading">Admin is not available</p>
        <p className="mt-1 text-sm text-ink">{error}</p>
        <button type="button" onClick={refresh} className="btn-primary mt-5">
          Try again
        </button>
      </Centered>
    )
  } else if (!session) {
    body = <Centered>Loading…</Centered>
  } else if (!session.configured) {
    body = <SetupPage onDone={refresh} />
  } else if (!session.authenticated) {
    body = <LoginPage insecure={!session.secure} onLogin={refresh} />
  } else {
    body = (
      <div className="min-h-screen bg-primary-50">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <img src="/assets/brand/logo.png" alt="" className="h-9 w-auto" />
              <p className="border-l border-neutral-200 pl-3 text-sm text-ink">
                <span className="block font-semibold text-heading">Offers admin</span>
                <span className="text-xs text-ink-soft">Signed in as {session.username}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/offers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
              >
                <ExternalLink size={16} aria-hidden />
                <span className="hidden sm:inline">View offers page</span>
              </a>
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 px-3 py-2 text-sm font-medium text-ink hover:bg-neutral-50"
              >
                <LogOut size={16} aria-hidden />
                Log out
              </button>
            </div>
          </div>
          <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4" aria-label="Admin sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold ${
                  tab === id ? 'border-primary-500 text-primary-600' : 'border-transparent text-ink hover:text-heading'
                }`}
              >
                <Icon size={16} aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </header>
        {!session.secure && <InsecureBanner />}
        <main className="mx-auto max-w-6xl px-4 py-6">
          {tab === 'offers' && <OffersManager onAuthLost={refresh} />}
          {tab === 'banner' && <PageBannerSettings onAuthLost={refresh} />}
          {tab === 'account' && <AccountSettings />}
        </main>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>Admin | Eagle Logistics</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {body}
    </>
  )
}

function Centered({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-primary-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-soft">
        {children}
      </div>
    </div>
  )
}

