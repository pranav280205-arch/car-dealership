import { useState } from 'react'

const BLANK = { make: '', model: '', category: '', year: '', price: '', quantity: '', description: '' }

/** Form state uses strings; convert to the types the API expects. */
function toPayload(form) {
  return {
    make: form.make.trim(),
    model: form.model.trim(),
    category: form.category.trim(),
    year: form.year === '' ? null : Number(form.year),
    price: Number(form.price),
    quantity: form.quantity === '' ? 0 : Number(form.quantity),
    description: form.description.trim() || null,
  }
}

function validate(form) {
  if (!form.make.trim() || !form.model.trim() || !form.category.trim() || form.price === '') {
    return 'Make, model, category and price are required.'
  }
  if (Number(form.price) < 0) return "Price can't be negative."
  if (form.quantity !== '' && Number(form.quantity) < 0) return "Quantity can't be negative."
  return ''
}

/** Used for both adding and editing a vehicle. */
export default function VehicleForm({ initial, onSubmit, onCancel, categories = [] }) {
  const editing = Boolean(initial)
  const [form, setForm] = useState(() =>
    initial
      ? Object.fromEntries(Object.keys(BLANK).map((k) => [k, initial[k] ?? '']))
      : BLANK,
  )
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validate(form)
    if (problem) {
      setError(problem)
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSubmit(toPayload(form))
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4" noValidate>
      {error && (
        <p role="alert" className="col-span-2 rounded-md bg-red-50 px-3 py-2 text-sm text-stop">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="v-make" className="label">Make</label>
        <input id="v-make" className="field" value={form.make} onChange={set('make')} placeholder="Hyundai" />
      </div>
      <div>
        <label htmlFor="v-model" className="label">Model</label>
        <input id="v-model" className="field" value={form.model} onChange={set('model')} placeholder="Creta" />
      </div>
      <div>
        <label htmlFor="v-category" className="label">Category</label>
        <input id="v-category" className="field" list="category-options" value={form.category} onChange={set('category')} placeholder="SUV" />
        <datalist id="category-options">
          {categories.map((c) => <option key={c} value={c} />)}
        </datalist>
      </div>
      <div>
        <label htmlFor="v-year" className="label">Year (optional)</label>
        <input id="v-year" type="number" className="field" value={form.year} onChange={set('year')} placeholder="2024" />
      </div>
      <div>
        <label htmlFor="v-price" className="label">Price (₹)</label>
        <input id="v-price" type="number" min="0" className="field" value={form.price} onChange={set('price')} placeholder="1450000" />
      </div>
      <div>
        <label htmlFor="v-quantity" className="label">Quantity in stock</label>
        <input id="v-quantity" type="number" min="0" className="field" value={form.quantity} onChange={set('quantity')} placeholder="0" />
      </div>
      <div className="col-span-2">
        <label htmlFor="v-description" className="label">Notes for buyers (optional)</label>
        <textarea id="v-description" rows="2" className="field" value={form.description} onChange={set('description')} />
      </div>
      <div className="col-span-2 flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? 'Saving…' : editing ? 'Save changes' : 'Add vehicle'}
        </button>
      </div>
    </form>
  )
}
