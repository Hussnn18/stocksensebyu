import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);
let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      const id = nextId++;
      setToasts((list) => [...list.slice(-2), { id, type, message }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss],
  );

  const toast = useMemo(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] z-[60] flex w-[min(24rem,calc(100%-2rem))] flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto flex items-start gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white shadow-2xl"
          >
            {t.type === 'error' ? (
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
            )}
            <span className="flex-1">{t.message}</span>
            <button className="text-slate-400 hover:text-white cursor-pointer" onClick={() => dismiss(t.id)} aria-label="Dismiss">
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
