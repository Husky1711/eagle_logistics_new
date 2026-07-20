import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import Home from './pages/Home'
import Services from './pages/Services'
import Pricing from './pages/Pricing'
import Tracking from './pages/Tracking'
import Offers from './pages/Offers'
import ThingsWeSend, { ThingsWeSendItem } from './pages/ThingsWeSend'
import Cargo from './pages/Cargo'
import About from './pages/About'
import Contact from './pages/Contact'
import { Privacy, Terms } from './pages/Legal'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Home />} />
          <Route path="services" element={<Services />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="offers" element={<Offers />} />
          <Route path="things-we-send" element={<ThingsWeSend />} />
          <Route path="things-we-send/:slug" element={<ThingsWeSendItem />} />
          <Route path="cargo/:slug" element={<Cargo />} />
          <Route path="about" element={<About />} />
          <Route path="contact" element={<Contact />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="terms" element={<Terms />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
