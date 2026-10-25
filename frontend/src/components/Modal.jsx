import { useEffect, useId, useRef } from 'react'

/** Simple accessible dialog: Esc or the backdrop closes it, focus moves inside. */
export default function Modal({ title, onClose, children }) {
  const titleId = useId()
  const panel = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    panel.current?.querySelector('input, select, textarea, button')?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous?.focus?.()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-tarmac/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="max-h-[90vh] w-full overflow-y-auto rounded-t-xl bg-white p-6 shadow-xl sm:max-w-lg sm:rounded-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-2xl font-semibold">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
