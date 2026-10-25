/** Shared frame for the login and register screens. */
export default function AuthLayout({ title, children, footer }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-tarmac p-12 text-white lg:flex">
        <Logo light />
        <div>
          <p className="font-display text-5xl font-semibold leading-none">
            Every car on the lot,
            <br />
            in one place.
          </p>
          <p className="mt-4 max-w-sm text-white/70">
            Check what's in stock, sell a car in one click, and restock before the last one goes.
          </p>
        </div>
        <ParkingLines />
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          <div className="mt-6">{children}</div>
          {footer && <p className="mt-6 text-sm text-tarmac-soft">{footer}</p>}
        </div>
      </section>
    </main>
  )
}

export function Logo({ light = false }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="rounded border-2 border-tarmac bg-tag px-1.5 font-display text-lg font-bold leading-6 text-tarmac">
        42
      </span>
      <span className={`font-display text-xl font-semibold ${light ? 'text-white' : ''}`}>Lot42</span>
    </span>
  )
}

/** Painted parking-bay lines along the bottom of the panel. */
function ParkingLines() {
  return (
    <div aria-hidden="true" className="flex h-16 gap-10 border-t-4 border-white/80">
      {Array.from({ length: 6 }).map((_, i) => (
        <span key={i} className="w-1 bg-white/80" />
      ))}
    </div>
  )
}
