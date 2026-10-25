import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client'
import Modal from '../components/Modal'
import VehicleForm from '../components/VehicleForm'
import { useToast } from '../components/Toast'
import { formatPrice } from '../utils/format'

export default function AdminPage() {
  const toast = useToast()
  const [vehicles, setVehicles] = useState([])
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')
  // which dialog is open: { type: 'add' | 'edit' | 'restock' | 'delete', vehicle? }
  const [dialog, setDialog] = useState(null)
  const close = useCallback(() => setDialog(null), [])

  const refreshNumbers = useCallback(() => {
    api.stats().then(setStats).catch(() => {})
    api.allOrders().then(setOrders).catch(() => {})
  }, [])

  useEffect(() => {
    api.listVehicles().then(setVehicles).catch((err) => setError(err.message))
    refreshNumbers()
  }, [refreshNumbers])

  const replace = (updated) => setVehicles((list) => list.map((v) => (v.id === updated.id ? updated : v)))

  async function handleAdd(data) {
    const created = await api.addVehicle(data)
    setVehicles((list) => [...list, created])
    toast(`Added ${created.make} ${created.model}.`)
    close()
    refreshNumbers()
  }

  async function handleEdit(data) {
    const updated = await api.updateVehicle(dialog.vehicle.id, data)
    replace(updated)
    toast(`Saved changes to ${updated.make} ${updated.model}.`)
    close()
    refreshNumbers()
  }

  async function handleRestock(quantity) {
    const updated = await api.restock(dialog.vehicle.id, quantity)
    replace(updated)
    toast(`Restocked ${updated.make} ${updated.model}. ${updated.quantity} now in stock.`)
    close()
    refreshNumbers()
  }

  async function handleDelete() {
    const { vehicle } = dialog
    try {
      await api.deleteVehicle(vehicle.id)
      setVehicles((list) => list.filter((v) => v.id !== vehicle.id))
      toast(`Deleted ${vehicle.make} ${vehicle.model}.`)
      refreshNumbers()
    } catch (err) {
      toast(err.message, 'error')
    }
    close()
  }

  const categories = [...new Set(vehicles.map((v) => v.category))].sort()

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl font-semibold">Manage inventory</h1>
        <button type="button" className="btn-tag" onClick={() => setDialog({ type: 'add' })}>
          Add a vehicle
        </button>
      </header>

      {error && <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-stop">{error}</p>}

      {stats && <StatsStrip stats={stats} />}

      {stats && (
        <div className="grid gap-4 lg:grid-cols-2">
          <LowStockPanel vehicles={stats.low_stock} onRestock={(v) => setDialog({ type: 'restock', vehicle: v })} />
          <CategoryPanel rows={stats.by_category} />
        </div>
      )}

      <VehicleTable
        vehicles={vehicles}
        onEdit={(v) => setDialog({ type: 'edit', vehicle: v })}
        onRestock={(v) => setDialog({ type: 'restock', vehicle: v })}
        onDelete={(v) => setDialog({ type: 'delete', vehicle: v })}
      />

      <RecentOrders orders={orders} />

      {dialog?.type === 'add' && (
        <Modal title="Add a vehicle" onClose={close}>
          <VehicleForm onSubmit={handleAdd} onCancel={close} categories={categories} />
        </Modal>
      )}
      {dialog?.type === 'edit' && (
        <Modal title={`Edit ${dialog.vehicle.make} ${dialog.vehicle.model}`} onClose={close}>
          <VehicleForm initial={dialog.vehicle} onSubmit={handleEdit} onCancel={close} categories={categories} />
        </Modal>
      )}
      {dialog?.type === 'restock' && (
        <Modal title={`Restock ${dialog.vehicle.make} ${dialog.vehicle.model}`} onClose={close}>
          <RestockForm vehicle={dialog.vehicle} onSubmit={handleRestock} onCancel={close} />
        </Modal>
      )}
      {dialog?.type === 'delete' && (
        <Modal title={`Delete ${dialog.vehicle.make} ${dialog.vehicle.model}?`} onClose={close}>
          <p className="text-sm leading-relaxed text-tarmac-soft">
            It will disappear from the lot straight away. Past orders for this car are kept.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={close}>Keep it</button>
            <button type="button" className="btn-danger" onClick={handleDelete}>Delete vehicle</button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatsStrip({ stats }) {
  const items = [
    ['Stock value', formatPrice(stats.stock_value)],
    ['Cars in stock', stats.units_in_stock],
    ['Cars sold', stats.units_sold],
    ['Revenue', formatPrice(stats.revenue)],
  ]
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-line bg-white lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label} className="border-line p-5 [&:not(:last-child)]:border-r max-lg:[&:nth-child(2)]:border-r-0 max-lg:[&:nth-child(-n+2)]:border-b">
          <dt className="text-sm text-tarmac-soft">{label}</dt>
          <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function LowStockPanel({ vehicles, onRestock }) {
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="font-display text-xl font-semibold">Running low</h2>
      <p className="text-sm text-tarmac-soft">Two or fewer left. Reorder before these sell out.</p>
      {vehicles.length === 0 ? (
        <p className="mt-4 text-sm">Nothing is running low right now.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {vehicles.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                {v.make} {v.model}{' '}
                <span className={`text-sm font-semibold ${v.quantity === 0 ? 'text-stop' : 'text-tag-deep'}`}>
                  {v.quantity === 0 ? 'sold out' : `${v.quantity} left`}
                </span>
              </span>
              <button type="button" className="btn-ghost px-3 py-1" onClick={() => onRestock(v)}>
                Restock
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CategoryPanel({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.units))
  return (
    <section className="rounded-lg border border-line bg-white p-5">
      <h2 className="font-display text-xl font-semibold">Stock by category</h2>
      <p className="text-sm text-tarmac-soft">Cars available in each category.</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.category} className="grid grid-cols-[6rem_1fr_2.5rem] items-center gap-3 text-sm">
            <span className="truncate">{r.category}</span>
            <span className="h-3 rounded-sm bg-concrete">
              <span className="block h-full rounded-sm bg-tarmac" style={{ width: `${(r.units / max) * 100}%` }} />
            </span>
            <span className="text-right tabular-nums">{r.units}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function VehicleTable({ vehicles, onEdit, onRestock, onDelete }) {
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-semibold">All vehicles</h2>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-line bg-concrete/60 text-tarmac-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Vehicle</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">In stock</th>
              <th className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-3">
                  <span className="text-tarmac-soft">{v.make}</span> <span className="font-semibold">{v.model}</span>
                </td>
                <td className="px-4 py-3">{v.category}</td>
                <td className="px-4 py-3 text-right tabular-nums">{formatPrice(v.price)}</td>
                <td className={`px-4 py-3 text-right tabular-nums ${v.quantity === 0 ? 'font-semibold text-stop' : ''}`}>
                  {v.quantity}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" className="btn-ghost px-3 py-1" onClick={() => onEdit(v)}>Edit</button>
                    <button type="button" className="btn-ghost px-3 py-1" onClick={() => onRestock(v)}>Restock</button>
                    <button type="button" className="btn px-3 py-1 text-stop hover:bg-red-50" onClick={() => onDelete(v)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function RestockForm({ vehicle, onSubmit, onCancel }) {
  const [amount, setAmount] = useState('5')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const n = Number(amount)
    if (!Number.isInteger(n) || n < 1) {
      setError('Enter a whole number of 1 or more.')
      return
    }
    try {
      await onSubmit(n)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <p className="text-sm text-tarmac-soft">Currently {vehicle.quantity} in stock.</p>
      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-stop">{error}</p>}
      <label htmlFor="restock-amount" className="label mt-4">How many arrived?</label>
      <input id="restock-amount" type="number" min="1" className="field" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary">Add to stock</button>
      </div>
    </form>
  )
}

function RecentOrders({ orders }) {
  if (orders.length === 0) return null
  return (
    <section>
      <h2 className="mb-3 font-display text-2xl font-semibold">Recent sales</h2>
      <ul className="divide-y divide-line rounded-lg border border-line bg-white">
        {orders.slice(0, 8).map((o) => (
          <li key={o.id} className="flex flex-wrap justify-between gap-2 px-4 py-3 text-sm">
            <span>
              <span className="font-semibold">{o.vehicle_name}</span>
              {o.quantity > 1 && ` × ${o.quantity}`} to {o.buyer_email}
            </span>
            <span className="tabular-nums text-tarmac-soft">
              {formatPrice(o.total)}, {new Date(o.created_at).toLocaleDateString('en-IN')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
