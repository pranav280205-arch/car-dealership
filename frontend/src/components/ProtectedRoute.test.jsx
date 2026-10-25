import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import ProtectedRoute from './ProtectedRoute'

function renderWithUser(user, adminOnly = false) {
  if (user) {
    localStorage.setItem('lot42.token', 'tok')
    localStorage.setItem('lot42.user', JSON.stringify(user))
  }
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve(user) })

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/secret']}>
        <Routes>
          <Route path="/login" element={<p>Login page</p>} />
          <Route path="/" element={<p>Home page</p>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute adminOnly={adminOnly}>
                <p>Secret stuff</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  it('sends logged-out visitors to the login page', () => {
    renderWithUser(null)
    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('lets a logged-in user through', () => {
    renderWithUser({ id: 1, role: 'user' })
    expect(screen.getByText('Secret stuff')).toBeInTheDocument()
  })

  it('sends a normal user away from admin-only pages', () => {
    renderWithUser({ id: 1, role: 'user' }, true)
    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('lets an admin into admin-only pages', () => {
    renderWithUser({ id: 1, role: 'admin' }, true)
    expect(screen.getByText('Secret stuff')).toBeInTheDocument()
  })
})
