import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError("Passwords don't match. Type the same password in both boxes.")
      return
    }
    if (form.password.length < 6) {
      setError('Password needs at least 6 characters.')
      return
    }
    setSubmitting(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      footer={
        <>
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-tarmac underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-stop">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" className="field" autoComplete="name" value={form.name} onChange={update('name')} required />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" type="email" className="field" autoComplete="email" value={form.email} onChange={update('email')} required />
        </div>
        <div>
          <label htmlFor="password" className="label">Password</label>
          <input id="password" type="password" className="field" autoComplete="new-password" value={form.password} onChange={update('password')} required />
        </div>
        <div>
          <label htmlFor="confirm" className="label">Confirm password</label>
          <input id="confirm" type="password" className="field" autoComplete="new-password" value={form.confirm} onChange={update('confirm')} required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  )
}
