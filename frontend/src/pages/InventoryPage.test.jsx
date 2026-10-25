import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/Toast'
import InventoryPage from './InventoryPage'

const CARS = [
  { id: 1, make: 'Tata', model: 'Nexon EV', category: 'Electric', year: 2024, price: 1490000, quantity: 2, description: null },
  { id: 2, make: 'Kia', model: 'Seltos', category: 'SUV', year: 2024, price: 1350000, quantity: 0, description: null },
  { id: 3, make: 'Honda', model: 'City', category: 'Sedan', year: 2023, price: 1250000, quantity: 3, description: null },
]

function json(status, body) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })
}

/** Fake backend: routes by URL and records every call. */
function mockBackend({ searchResult = CARS } = {}) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((url, opts = {}) => {
    if (url.startsWith('/api/vehicles/search')) return json(200, searchResult)
    if (url === '/api/vehicles') return json(200, CARS)
    if (url === '/api/auth/me') return json(200, { id: 9, role: 'user' })
    if (url.endsWith('/purchase') && opts.method === 'POST') {
      return json(200, {
        order: { id: 1, vehicle_name: 'Tata Nexon EV', quantity: 1, unit_price: 1490000, total: 1490000 },
        vehicle: { ...CARS[0], quantity: 1 },
      })
    }
    return json(404, { detail: 'not mocked' })
  })
}

function renderPage(path = '/') {
  localStorage.setItem('lot42.token', 'tok')
  localStorage.setItem('lot42.user', JSON.stringify({ id: 9, name: 'Asha', role: 'user' }))
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter initialEntries={[path]}>
          <InventoryPage />
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>,
  )
}

beforeEach(() => vi.restoreAllMocks())

describe('InventoryPage', () => {
  it('lists every car on the lot', async () => {
    mockBackend()
    renderPage()

    expect(await screen.findByText('Nexon EV')).toBeInTheDocument()
    expect(screen.getByText('Seltos')).toBeInTheDocument()
    expect(screen.getByText('City')).toBeInTheDocument()
  })

  it('sends the chosen filters to the search endpoint', async () => {
    const fetchMock = mockBackend()
    renderPage()
    await screen.findByText('Nexon EV')

    await userEvent.selectOptions(screen.getByLabelText(/category/i), 'SUV')
    await userEvent.type(screen.getByLabelText(/max price/i), '1400000')

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map(([u]) => u)
      expect(urls).toContain('/api/vehicles/search?category=SUV&max_price=1400000')
    })
  })

  it('reads filters from the URL so a filtered view can be shared', async () => {
    const fetchMock = mockBackend()
    renderPage('/?make=Tata')

    await screen.findByText('Nexon EV')
    expect(screen.getByLabelText(/make/i)).toHaveValue('Tata')
    expect(fetchMock.mock.calls.map(([u]) => u)).toContain('/api/vehicles/search?make=Tata')
  })

  it('shows a helpful empty state when nothing matches', async () => {
    mockBackend({ searchResult: [] })
    renderPage('/?make=Ferrari')

    expect(await screen.findByText(/no cars match/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument()
  })

  it('buys a car, updates its stock and confirms with a toast', async () => {
    mockBackend()
    renderPage()

    const card = (await screen.findByText('Nexon EV')).closest('article')
    expect(within(card).getByText('Only 2 left')).toBeInTheDocument()

    await userEvent.click(within(card).getByRole('button', { name: /buy/i }))

    expect(await within(card).findByText('Only 1 left')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent(/bought tata nexon ev/i)
  })

  it('keeps the sold-out car visible but not purchasable', async () => {
    mockBackend()
    renderPage()

    const card = (await screen.findByText('Seltos')).closest('article')
    expect(within(card).getByRole('button', { name: /sold out/i })).toBeDisabled()
  })
})
