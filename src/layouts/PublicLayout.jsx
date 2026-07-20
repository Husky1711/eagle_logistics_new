import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { SettingsProvider } from '../context/SettingsContext'
import { prefetchContent } from '../hooks/useContent'
import TopBar from '../components/public/TopBar'
import Header from '../components/public/Header'
import Footer from '../components/public/Footer'

const CONTENT_PREFETCH = [
  'pages/home.json',
  'pages/services.json',
  'pages/pricing.json',
  'pages/tracking.json',
  'pages/offers.json',
  'pages/things-we-send.json',
  'pages/cargo.json',
  'pages/about.json',
  'pages/contact.json',
  'pages/privacy.json',
  'pages/terms.json',
]

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function PublicLayout() {
  useEffect(() => {
    prefetchContent(CONTENT_PREFETCH)
  }, [])

  return (
    <SettingsProvider>
      <ScrollToTop />
      <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
        <TopBar />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SettingsProvider>
  )
}
