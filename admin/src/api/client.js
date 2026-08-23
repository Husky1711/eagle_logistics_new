const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

async function request(path, options = {}) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch {
    throw new Error('Network error — is the API running and CORS configured for this admin origin?')
  }

  if (!response.ok) {
    let detail = 'Request failed'
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // ignore
    }
    if (Array.isArray(detail)) {
      detail = detail.map((item) => item.msg || String(item)).join(', ')
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

  if (response.status === 204) return null
  return response.json()
}

async function uploadRequest(path, formData) {
  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    })
  } catch {
    throw new Error('Network error — is the API running and CORS configured for this admin origin?')
  }

  if (!response.ok) {
    let detail = 'Upload failed'
    try {
      const body = await response.json()
      detail = body.detail || detail
    } catch {
      // ignore
    }
    if (Array.isArray(detail)) {
      detail = detail.map((item) => item.msg || String(item)).join(', ')
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
  }

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
  getOffersPage: () => request('/admin/pages/offers'),
  updateOffersPage: (data) =>
    request('/admin/pages/offers', { method: 'PUT', body: JSON.stringify(data) }),
  getHomePage: () => request('/admin/pages/home'),
  updateHomePage: (data) =>
    request('/admin/pages/home', { method: 'PUT', body: JSON.stringify(data) }),
  uploadMedia: (folder, file, targetFilename) => {
    const form = new FormData()
    form.append('folder', folder)
    form.append('file', file)
    if (targetFilename) {
      form.append('target_filename', targetFilename)
    }
    return uploadRequest('/admin/media/upload', form)
  },
  listMedia: (folder) => request(`/admin/media/${folder}`),
  getCouriers: () => request('/admin/couriers'),
  updateCouriers: (data) => request('/admin/couriers', { method: 'PUT', body: JSON.stringify(data) }),
  getPricingRules: () => request('/admin/pricing-rules'),
  updatePricingRules: (data) =>
    request('/admin/pricing-rules', { method: 'PUT', body: JSON.stringify(data) }),
  getMeta: () => request('/admin/meta'),
  syncContent: () => request('/admin/publish/sync', { method: 'POST' }),
}
