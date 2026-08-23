import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Offers from './pages/Offers'
import OffersPage from './pages/OffersPage'
import HomePage from './pages/HomePage'
import Couriers from './pages/Couriers'
import PricingRules from './pages/PricingRules'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route index element={<Dashboard />} />
        <Route path="settings" element={<Settings />} />
        <Route path="site-banner" element={<Offers />} />
        <Route path="offers" element={<Navigate to="/site-banner" replace />} />
        <Route path="pages/offers" element={<OffersPage />} />
        <Route path="pages/home" element={<HomePage />} />
        <Route path="couriers" element={<Couriers />} />
        <Route path="pricing-rules" element={<PricingRules />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
