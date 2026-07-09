const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // ignore
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  if (response.status === 204) return null
  return response.json()
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  getSettings: () => request('/admin/settings'),
  updateSettings: (data) => request('/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
  getOffers: () => request('/admin/offers'),
  updateOffers: (data) => request('/admin/offers', { method: 'PUT', body: JSON.stringify(data) }),
  syncContent: () => request('/admin/publish/sync', { method: 'POST' }),
}
