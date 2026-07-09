import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-primary-500 text-white' : 'text-neutral-700 hover:bg-neutral-200'
  }`

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  const handleLogout = async () => {
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
          <NavLink to="/" end className={navClass}>
            Dashboard
          </NavLink>
          <NavLink to="/settings" className={navClass}>
            Settings
          </NavLink>
          <NavLink to="/offers" className={navClass}>
            Offers
          </NavLink>
          <a
            href="http://localhost:5173"
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
