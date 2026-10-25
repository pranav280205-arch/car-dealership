const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

/** 1850000 -> "₹18,50,000" */
export function formatPrice(value) {
  return rupees.format(value)
}

/** Short, human stock message used on cards and tables. */
export function stockLabel(quantity) {
  if (quantity <= 0) return 'Sold out'
  if (quantity <= 2) return `Only ${quantity} left`
  return `${quantity} in stock`
}

const PARAM_NAMES = {
  q: 'q',
  make: 'make',
  model: 'model',
  category: 'category',
  minPrice: 'min_price',
  maxPrice: 'max_price',
}

/** Turns the filter form state into query params for /api/vehicles/search. */
export function toSearchParams(filters) {
  const params = new URLSearchParams()
  for (const [key, apiName] of Object.entries(PARAM_NAMES)) {
    const value = filters[key]
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(apiName, String(value).trim())
    }
  }
  if (filters.inStock) params.set('in_stock', 'true')
  return params
}
