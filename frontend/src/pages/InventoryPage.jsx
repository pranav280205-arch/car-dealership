import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import FilterBar, { EMPTY_FILTERS } from '../components/FilterBar'
import VehicleCard from '../components/VehicleCard'
import { useToast } from '../components/Toast'
import useDebouncedValue from '../hooks/useDebouncedValue'
import { formatPrice, toSearchParams } from '../utils/format'

/** URL query string -> filter form state (the reverse of toSearchParams). */
function filtersFromUrl(params) {
  return {
    q: params.get('q') ?? '',
    make: params.get('make') ?? '',
    category: params.get('category') ?? '',
    minPrice: params.get('min_price') ?? '',
    maxPrice: params.get('max_price') ?? '',
    inStock: params.get('in_stock') === 'true',
  }
}

export default function InventoryPage() {
  const toast = useToast()
  const [urlParams, setUrlParams] = useSearchParams()
  const [filters, setFilters] = useState(() => filtersFromUrl(urlParams))
  const [vehicles, setVehicles] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buyingId, setBuyingId] = useState(null)

  // Wait until the user stops typing before hitting the API.
  const debouncedFilters = useDebouncedValue(filters, 250)
  const query = useMemo(() => toSearchParams(debouncedFilters).toString(), [debouncedFilters])

  // Category dropdown is built from the whole lot, not the filtered results.
  useEffect(() => {
    api
      .listVehicles()
      .then((all) => setCategories([...new Set(all.map((v) => v.category))].sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let ignore = false
    setLoading(true)
    setUrlParams(new URLSearchParams(query), { replace: true })
    api
      .searchVehicles(query)
      .then((data) => {
        if (!ignore) {
          setVehicles(data)
          setError('')
        }
      })
      .catch((err) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false))
    return () => {
      ignore = true
    }
  }, [query, setUrlParams])

  async function handlePurchase(vehicle) {
    setBuyingId(vehicle.id)
    try {
      const { vehicle: updated } = await api.purchase(vehicle.id)
      setVehicles((list) => list.map((v) => (v.id === updated.id ? updated : v)))
      toast(`Bought ${vehicle.make} ${vehicle.model} for ${formatPrice(vehicle.price)}.`)
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setBuyingId(null)
    }
  }

  const inStockCount = vehicles.filter((v) => v.quantity > 0).length

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-4xl font-semibold">On the lot</h1>
        {!loading && !error && (
          <p className="text-sm text-tarmac-soft">
            {vehicles.length} {vehicles.length === 1 ? 'model' : 'models'} shown, {inStockCount} available to buy
          </p>
        )}
      </header>

      <FilterBar filters={filters} onChange={setFilters} categories={categories} />

      {error && (
        <p role="alert" className="rounded-md bg-red-50 p-4 text-sm text-stop">
          {error}
        </p>
      )}

      {loading && vehicles.length === 0 && !error && <CardSkeletons />}

      {!loading && !error && vehicles.length === 0 && (
        <div className="rounded-lg border border-dashed border-line bg-white p-10 text-center">
          <p className="font-display text-2xl font-semibold">No cars match these filters</p>
          <p className="mt-1 text-sm text-tarmac-soft">Try a wider price range or a different make.</p>
          <button type="button" className="btn-ghost mt-4" onClick={() => setFilters(EMPTY_FILTERS)}>
            Clear filters
          </button>
        </div>
      )}

      {vehicles.length > 0 && (
        <div
          className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-60' : ''}`}
          aria-busy={loading}
        >
          {vehicles.map((v) => (
            <VehicleCard key={v.id} vehicle={v} onPurchase={handlePurchase} busy={buyingId === v.id} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardSkeletons() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-lg border border-line bg-white" />
      ))}
    </div>
  )
}
