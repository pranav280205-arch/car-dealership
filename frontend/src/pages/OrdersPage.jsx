import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatPrice } from '../utils/format'

export default function OrdersPage() {
  const [orders, setOrders] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.myOrders().then(setOrders).catch((err) => setError(err.message))
  }, [])

  const total = orders?.reduce((sum, o) => sum + o.total, 0) ?? 0

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl font-semibold">My purchases</h1>

      {error && <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-stop">{error}</p>}

      {orders?.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
          <p className="font-display text-2xl font-semibold">You haven't bought anything yet</p>
          <Link to="/" className="btn-primary mt-4">Browse the lot</Link>
        </div>
      )}

      {orders?.length > 0 && (
        <>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {orders.map((o) => (
              <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                <div>
                  <p className="font-semibold">
                    {o.vehicle_name}
                    {o.quantity > 1 && <span className="font-normal text-tarmac-soft"> × {o.quantity}</span>}
                  </p>
                  <p className="text-sm text-tarmac-soft">
                    {new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <span className="font-display text-xl font-semibold tabular-nums">{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
          <p className="text-right text-sm text-tarmac-soft">
            Total spent: <span className="font-semibold text-tarmac">{formatPrice(total)}</span>
          </p>
        </>
      )}
    </div>
  )
}
