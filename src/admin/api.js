/** Tiny client for the PHP admin API (public/api/*.php). Keeps the CSRF token. */
let csrf = ''

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.status = status
    this.data = data
  }
}

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = { Accept: 'application/json' }
  if (method !== 'GET') headers['X-CSRF-Token'] = csrf
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`/api/${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: form || (body !== undefined ? JSON.stringify(body) : undefined),
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your internet connection.', 0)
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json() : null
  if (data?.csrf) csrf = data.csrf
  if (!res.ok || !data?.ok) {
    const fallback = res.status === 404 ? 'Admin API not found on this server.' : `Request failed (${res.status})`
    throw new ApiError(data?.error || fallback, res.status, data)
  }
  return data
}

export const api = {
  session: () => request('auth.php'),
  login: (username, password) => request('auth.php?action=login', { method: 'POST', body: { username, password } }),
  logout: () => request('auth.php?action=logout', { method: 'POST', body: {} }),
  changePassword: (current, next) =>
    request('auth.php?action=password', { method: 'POST', body: { current, new: next } }),
  setupStatus: () => request('setup.php'),
  setup: (username, password, feedbackTo) =>
    request('setup.php', { method: 'POST', body: { username, password, feedbackTo } }),

  offers: () => request('offers.php?scope=all'),
  saveOffer: (offer) => request('offers.php?action=save', { method: 'POST', body: { offer } }),
  deleteOffer: (id) => request('offers.php?action=delete', { method: 'POST', body: { id } }),
  reorderOffers: (ids) => request('offers.php?action=reorder', { method: 'POST', body: { ids } }),
  saveSettings: (settings) => request('offers.php?action=settings', { method: 'POST', body: { settings } }),

  upload: (file) => {
    const form = new FormData()
    form.append('file', file)
    return request('upload.php', { method: 'POST', form })
  },
}
