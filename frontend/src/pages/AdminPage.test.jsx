import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { ToastProvider } from '../components/Toast'
import AdminPage from './AdminPage'

const CARS = [
  { id: 1, make: 'Tata', model: 'Nexon EV', category: 'Electric', year: 2024, price: 1490000, quantity: 6, description: null },
  { id: 2, make: 'Kia', model: 'Seltos', category: 'SUV', year: 2024, price: 1350000, quantity: 0, description: null },
]
const STATS = {
  total_models: 2,
  units_in_stock: 6,
  stock_value: 8940000,
  units_sold: 3,
  revenue: 4200000,
  low_stock: [CARS[1]],
  by_category: [
    { category: 'Electric', models: 1, units: 6 },
    { category: 'SUV', models: 1, units: 0 },
  ],
}

function json(status, body) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })
}

function mockBackend() {
  return vi.spyOn(globalThis, 'fetch').mockImplementation((url, opts = {}) => {
    const method = opts.method ?? 'GET'
    if (url === '/api/stats') return json(200, STATS)
    if (url === '/api/orders') return json(200, [])
    if (url === '/api/vehicles' && method === 'GET') return json(200, CARS)
    if (url === '/api/vehicles' && method === 'POST') {
      return json(201, { id: 3, ...JSON.parse(opts.body) })
    }
    if (url === '/api/vehicles/2/restock') return json(200, { ...CARS[1], quantity: 4 })
    if (url === '/api/vehicles/1' && method === 'DELETE') return Promise.resolve({ ok: true, status: 204 })
    if (url === '/api/auth/me') return json(200, { id: 1, role: 'admin' })
    return json(404, { detail: `not mocked: ${method} ${url}` })
  })
}

function renderPage() {
  localStorage.setItem('lot42.token', 'tok')
  localStorage.setItem('lot42.user', JSON.stringify({ id: 1, name: 'Admin', role: 'admin' }))
  return render(
    <AuthProvider>
      <ToastProvider>
        <MemoryRouter>
          <AdminPage />
        </MemoryRouter>
      </ToastProvider>
    </AuthProvider>,
  )
}

const rowFor = async (model) => (await screen.findByRole('cell', { name: new RegExp(model) })).closest('tr')

beforeEach(() => vi.restoreAllMocks())

describe('AdminPage', () => {
  it('shows the headline numbers', async () => {
    mockBackend()
    renderPage()

    expect(await screen.findByText('₹89,40,000')).toBeInTheDocument() // stock value
    expect(screen.getByText('₹42,00,000')).toBeInTheDocument() // revenue
  })

  it('lists low-stock cars so they can be reordered', async () => {
    mockBackend()
    renderPage()

    const panel = (await screen.findByRole('heading', { name: /running low/i })).closest('section')
    expect(within(panel).getByText(/Kia Seltos/)).toBeInTheDocument()
  })

  it('adds a vehicle through the form and shows it in the table', async () => {
    const fetchMock = mockBackend()
    renderPage()
    await rowFor('Nexon EV')

    await userEvent.click(screen.getByRole('button', { name: /add a vehicle/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText(/^make/i), 'Hyundai')
    await userEvent.type(within(dialog).getByLabelText(/^model/i), 'Creta')
    await userEvent.type(within(dialog).getByLabelText(/category/i), 'SUV')
    await userEvent.type(within(dialog).getByLabelText(/price/i), '1450000')
    await userEvent.type(within(dialog).getByLabelText(/quantity/i), '3')
    await userEvent.click(within(dialog).getByRole('button', { name: /add vehicle/i }))

    expect(await rowFor('Creta')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/vehicles', expect.objectContaining({ method: 'POST' }))
  })

  it('restocks a car', async () => {
    mockBackend()
    renderPage()

    const row = await rowFor('Seltos')
    await userEvent.click(within(row).getByRole('button', { name: /restock/i }))
    const dialog = screen.getByRole('dialog')
    await userEvent.clear(within(dialog).getByLabelText(/how many/i))
    await userEvent.type(within(dialog).getByLabelText(/how many/i), '4')
    await userEvent.click(within(dialog).getByRole('button', { name: /add to stock/i }))

    expect(await within(row).findByText('4')).toBeInTheDocument()
  })

  it('asks before deleting and removes the row after confirming', async () => {
    const fetchMock = mockBackend()
    renderPage()

    const row = await rowFor('Nexon EV')
    await userEvent.click(within(row).getByRole('button', { name: /delete/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent(/delete tata nexon ev/i)
    expect(fetchMock).not.toHaveBeenCalledWith('/api/vehicles/1', expect.anything())

    await userEvent.click(within(dialog).getByRole('button', { name: /delete vehicle/i }))

    await vi.waitFor(() =>
      expect(screen.queryByRole('cell', { name: /Nexon EV/ })).not.toBeInTheDocument(),
    )
  })
})
