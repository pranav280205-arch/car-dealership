/**
 * Thin wrapper around fetch for our API.
 * - adds the JWT from localStorage
 * - turns error responses into an ApiError with a readable message
 */
const TOKEN_KEY = 'lot42.token'
const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** FastAPI validation errors come back as a list; make them one sentence. */
function readableDetail(detail) {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0]
    const field = first.loc?.[first.loc.length - 1]
    return field ? `${field}: ${first.msg}` : first.msg
  }
  return 'Something went wrong. Please try again.'
}

export async function request(path, { method = 'GET', body, params } = {}) {
  const url = params && String(params) ? `${BASE_URL}${path}?${params}` : `${BASE_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new ApiError(0, "Can't reach the server. Is the backend running?")
  }

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, readableDetail(data?.detail))
  return data
}

// One object per resource keeps components free of URL strings.
export const api = {
  register: (data) => request('/api/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/api/auth/login', { method: 'POST', body: data }),
  me: () => request('/api/auth/me'),

  listVehicles: () => request('/api/vehicles'),
  searchVehicles: (params) => request('/api/vehicles/search', { params }),
  addVehicle: (data) => request('/api/vehicles', { method: 'POST', body: data }),
  updateVehicle: (id, data) => request(`/api/vehicles/${id}`, { method: 'PUT', body: data }),
  deleteVehicle: (id) => request(`/api/vehicles/${id}`, { method: 'DELETE' }),

  purchase: (id, quantity = 1) =>
    request(`/api/vehicles/${id}/purchase`, { method: 'POST', body: { quantity } }),
  restock: (id, quantity) =>
    request(`/api/vehicles/${id}/restock`, { method: 'POST', body: { quantity } }),

  myOrders: () => request('/api/orders/me'),
  allOrders: () => request('/api/orders'),
  stats: () => request('/api/stats'),
}
