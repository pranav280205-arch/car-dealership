import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage'

function jsonResponse(status, body) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) })
}

function renderAt(path) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<p>Inventory page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('LoginPage', () => {
  it('logs in, stores the token and goes to the inventory', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      jsonResponse(200, {
        access_token: 'tok123',
        token_type: 'bearer',
        user: { id: 1, name: 'Asha', email: 'asha@example.com', role: 'user' },
      }),
    )
    renderAt('/login')

    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByText('Inventory page')).toBeInTheDocument()
    expect(localStorage.getItem('lot42.token')).toBe('tok123')
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({ method: 'POST' }))
  })

  it('shows the server error when login fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      jsonResponse(401, { detail: 'Invalid email or password' }),
    )
    renderAt('/login')

    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong')
    await userEvent.click(screen.getByRole('button', { name: /log in/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
    expect(localStorage.getItem('lot42.token')).toBeNull()
  })
})

describe('RegisterPage', () => {
  it('stops the user when the two passwords differ, without calling the API', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    renderAt('/register')

    await userEvent.type(screen.getByLabelText(/name/i), 'Asha')
    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm/i), 'secret124')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(screen.getByRole('alert')).toHaveTextContent(/passwords don't match/i)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('registers and then logs the new user straight in', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation((url) =>
      url.endsWith('/register')
        ? jsonResponse(201, { id: 2, name: 'Asha', email: 'asha@example.com', role: 'user' })
        : jsonResponse(200, {
            access_token: 'tok456',
            token_type: 'bearer',
            user: { id: 2, name: 'Asha', email: 'asha@example.com', role: 'user' },
          }),
    )
    renderAt('/register')

    await userEvent.type(screen.getByLabelText(/name/i), 'Asha')
    await userEvent.type(screen.getByLabelText(/email/i), 'asha@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'secret123')
    await userEvent.type(screen.getByLabelText(/confirm/i), 'secret123')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))

    expect(await screen.findByText('Inventory page')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(localStorage.getItem('lot42.token')).toBe('tok456')
  })
})
