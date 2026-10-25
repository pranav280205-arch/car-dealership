export const EMPTY_FILTERS = {
  q: '',
  make: '',
  category: '',
  minPrice: '',
  maxPrice: '',
  inStock: false,
}

/** Search box plus filters. Fully controlled: the page owns the state. */
export default function FilterBar({ filters, onChange, categories }) {
  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    onChange({ ...filters, [field]: value })
  }

  const hasFilters = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS)

  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 rounded-lg border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]"
    >
      <div className="sm:col-span-2 lg:col-span-1">
        <label htmlFor="f-q" className="label">Search</label>
        <input id="f-q" type="search" className="field" placeholder="Make or model, e.g. Creta" value={filters.q} onChange={set('q')} />
      </div>
      <div>
        <label htmlFor="f-make" className="label">Make</label>
        <input id="f-make" className="field" placeholder="Any" value={filters.make} onChange={set('make')} />
      </div>
      <div>
        <label htmlFor="f-category" className="label">Category</label>
        <select id="f-category" className="field" value={filters.category} onChange={set('category')}>
          <option value="">All</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="f-min" className="label">Min price (₹)</label>
        <input id="f-min" type="number" min="0" step="50000" inputMode="numeric" className="field" placeholder="0" value={filters.minPrice} onChange={set('minPrice')} />
      </div>
      <div>
        <label htmlFor="f-max" className="label">Max price (₹)</label>
        <input id="f-max" type="number" min="0" step="50000" inputMode="numeric" className="field" placeholder="No limit" value={filters.maxPrice} onChange={set('maxPrice')} />
      </div>
      <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-1">
        <label className="flex h-10 cursor-pointer items-center gap-2 whitespace-nowrap text-sm">
          <input type="checkbox" className="size-4 accent-tarmac" checked={filters.inStock} onChange={set('inStock')} />
          In stock only
        </label>
        {hasFilters && (
          <button type="button" className="btn-ghost h-10" onClick={() => onChange(EMPTY_FILTERS)}>
            Reset
          </button>
        )}
      </div>
    </form>
  )
}
