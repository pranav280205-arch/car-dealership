import { createContext, useContext } from 'react'

export const ToastContext = createContext(() => {})

/** Returns show(message, tone) from the nearest <ToastProvider>. */
export function useToast() {
  return useContext(ToastContext)
}
