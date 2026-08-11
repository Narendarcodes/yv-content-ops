/**
 * Lightweight toast feedback for Folio — no external dependency, matching
 * the app's hand-rolled motion approach. Actions that change state should
 * always confirm themselves with a toast.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'

export type ToastTone = 'success' | 'info' | 'warning' | 'danger'

interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  desc?: string
}

const ToastContext = createContext<(tone: ToastTone, title: string, desc?: string) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

const toneMeta: Record<ToastTone, { icon: ReactNode }> = {
  success: { icon: <CheckCircle2 size={16} strokeWidth={1.75} className="text-success" /> },
  info: { icon: <Info size={16} strokeWidth={1.75} className="text-teal" /> },
  warning: { icon: <AlertTriangle size={16} strokeWidth={1.75} className="text-warning" /> },
  danger: { icon: <AlertTriangle size={16} strokeWidth={1.75} className="text-danger" /> },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((tone: ToastTone, title: string, desc?: string) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, tone, title, desc }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[340px] flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-in pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop"
          >
            <span className="mt-0.5 shrink-0">{toneMeta[t.tone].icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{t.title}</p>
              {t.desc && <p className="mt-0.5 text-[13px] leading-snug text-umber">{t.desc}</p>}
            </div>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="icon-btn !h-6 !w-6 shrink-0"
              aria-label="Dismiss"
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}