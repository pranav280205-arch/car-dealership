import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Logo } from './AuthLayout'

const linkClass = ({ isActive }) =>
  `rounded-md px-3 py-2 text-sm font-medium ${
    isActive ? 'bg-concrete text-tarmac' : 'text-tarmac-soft hover:text-tarmac'
  }`

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <NavLink to="/" aria-label="Lot42 home">
          <Logo />
        </NavLink>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          <NavLink to="/" end className={linkClass}>Inventory</NavLink>
          <NavLink to="/orders" className={linkClass}>My purchases</NavLink>
          {isAdmin && <NavLink to="/admin" className={linkClass}>Manage</NavLink>}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-tarmac-soft sm:inline">
            {user.name}
            {isAdmin && <span className="ml-2 rounded bg-tag px-1.5 py-0.5 text-xs font-semibold text-tarmac">admin</span>}
          </span>
          <button type="button" className="btn-ghost px-3 py-1.5" onClick={handleLogout}>Log out</button>
        </div>
      </nav>
    </header>
  )
}
