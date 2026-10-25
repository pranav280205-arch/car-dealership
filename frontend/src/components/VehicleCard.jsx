import { formatPrice, stockLabel } from '../utils/format'

function stockColour(quantity) {
  if (quantity === 0) return 'text-stop'
  if (quantity <= 2) return 'text-tag-deep'
  return 'text-go'
}

/**
 * One car on the lot. The price sits on a yellow tag, the way dealers
 * stick prices on windscreens.
 */
export default function VehicleCard({ vehicle, onPurchase, busy = false }) {
  const soldOut = vehicle.quantity === 0

  let buttonText = 'Buy this car'
  if (soldOut) buttonText = 'Sold out'
  else if (busy) buttonText = 'Buying…'

  return (
    <article
      className={`flex flex-col rounded-lg border border-line bg-white p-5 ${
        soldOut ? 'opacity-75' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-tarmac-soft">{vehicle.make}</p>
          <h3 className="font-display text-2xl font-semibold leading-tight">{vehicle.model}</h3>
        </div>
        <span className="shrink-0 rounded border-2 border-tarmac bg-tag px-2 py-0.5 font-display text-lg font-bold tabular-nums">
          {formatPrice(vehicle.price)}
        </span>
      </div>

      <p className="mt-2 text-sm text-tarmac-soft">
        {vehicle.category}
        {vehicle.year ? `, ${vehicle.year}` : ''}
      </p>

      {vehicle.description && (
        <p className="mt-3 text-sm leading-relaxed">{vehicle.description}</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <span className={`text-sm font-semibold ${stockColour(vehicle.quantity)}`}>
          {stockLabel(vehicle.quantity)}
        </span>
        <button
          type="button"
          className="btn-primary"
          disabled={soldOut || busy}
          onClick={() => onPurchase(vehicle)}
        >
          {buttonText}
        </button>
      </div>
    </article>
  )
}
