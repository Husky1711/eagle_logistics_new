import { Outlet } from 'react-router-dom'
import { SettingsProvider } from '../context/SettingsContext'
import Header from '../components/public/Header'
import Footer from '../components/public/Footer'
import OfferStrip from '../components/public/OfferStrip'

export default function PublicLayout() {
  return (
    <SettingsProvider>
      <div className="flex min-h-screen flex-col">
        <OfferStrip />
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SettingsProvider>
  )
}
