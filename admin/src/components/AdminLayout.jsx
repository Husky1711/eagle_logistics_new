import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUnsavedChanges } from '../context/UnsavedChangesContext'
import { PUBLIC_SITE_URL } from '../config/publicSite'

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-primary-500 text-white' : 'text-neutral-700 hover:bg-neutral-200'
  }`

function GuardedNavLink({ to, end, children }) {
  const { confirmLeave } = useUnsavedChanges()

  return (
    <NavLink
      to={to}
      end={end}
      className={navClass}
      onClick={(event) => {
        if (!confirmLeave()) event.preventDefault()
      }}
    >
      {children}
    </NavLink>
  )
}

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const { confirmLeave } = useUnsavedChanges()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  const handleLogout = async () => {
    if (!confirmLeave()) return
    setLogoutError('')
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      setLogoutError(err.message || 'Logout failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="font-display text-lg font-bold text-dark">Eagle Admin</p>
            <p className="text-xs text-neutral-500">Signed in as {user?.username}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            {logoutError && <p className="text-xs text-red-600">{logoutError}</p>}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-2 lg:flex-col">
          <GuardedNavLink to="/" end>
            Dashboard
          </GuardedNavLink>
          <GuardedNavLink to="/settings">Settings</GuardedNavLink>
          <GuardedNavLink to="/site-banner">Homepage offer strip</GuardedNavLink>
          <GuardedNavLink to="/pages/home">Home page</GuardedNavLink>
          <GuardedNavLink to="/pages/offers">Special Offers page</GuardedNavLink>
          <GuardedNavLink to="/couriers">Couriers</GuardedNavLink>
          <GuardedNavLink to="/pricing-rules">Pricing rules</GuardedNavLink>
          <a
            href={PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg px-3 py-2 text-sm font-medium text-primary-600 hover:bg-orange-50"
          >
            View public site ↗
          </a>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  )
}
