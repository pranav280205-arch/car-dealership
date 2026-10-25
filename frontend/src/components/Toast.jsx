import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(() => {})

/** Small notification shown at the bottom of the screen for a few seconds. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const show = useCallback((message, tone = 'success') => {
    clearTimeout(timer.current)
    setToast({ message, tone })
    timer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
        {toast && (
          <p
            role="status"
            className={`pointer-events-auto rounded-md px-4 py-3 text-sm font-medium shadow-lg ${
              toast.tone === 'error' ? 'bg-stop text-white' : 'bg-tarmac text-white'
            }`}
          >
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
