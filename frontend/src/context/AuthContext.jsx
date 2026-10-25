import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore } from '../api/client'

const USER_KEY = 'lot42.user'
const AuthContext = createContext(null)

function readSavedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw && tokenStore.get() ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser)

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const login = useCallback(async (email, password) => {
    const { access_token, user: loggedIn } = await api.login({ email, password })
    tokenStore.set(access_token)
    localStorage.setItem(USER_KEY, JSON.stringify(loggedIn))
    setUser(loggedIn)
    return loggedIn
  }, [])

  const register = useCallback(
    async (name, email, password) => {
      await api.register({ name, email, password })
      return login(email, password)
    },
    [login],
  )

  // If the saved token has expired, find out early and log out cleanly.
  useEffect(() => {
    if (!tokenStore.get()) return
    api.me().catch((err) => {
      if (err.status === 401) logout()
    })
  }, [logout])

  const value = useMemo(
    () => ({ user, isAdmin: user?.role === 'admin', login, register, logout }),
    [user, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
