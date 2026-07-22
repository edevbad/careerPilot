import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error:   (msg, dur) => addToast(msg, 'error',   dur),
    warning: (msg, dur) => addToast(msg, 'warning', dur),
    info:    (msg, dur) => addToast(msg, 'info',    dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

const icons = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }

function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem',
      display: 'flex', flexDirection: 'column', gap: '0.5rem',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => onRemove(t.id)}
          className="fade-up"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.875rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-solid)',
            backdropFilter: 'var(--glass-backdrop)',
            border: `1px solid ${
              t.type === 'success' ? 'rgba(16,185,129,0.3)' :
              t.type === 'error'   ? 'rgba(239,68,68,0.3)' :
              t.type === 'warning' ? 'rgba(245,158,11,0.3)' :
                                     'rgba(59,130,246,0.3)'
            }`,
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
            fontWeight: 500,
            maxWidth: '360px',
            pointerEvents: 'all',
            cursor: 'pointer',
          }}
        >
          <span style={{
            width: 24, height: 24, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            fontSize: '0.75rem', fontWeight: 700,
            background:
              t.type === 'success' ? 'rgba(16,185,129,0.2)' :
              t.type === 'error'   ? 'rgba(239,68,68,0.2)' :
              t.type === 'warning' ? 'rgba(245,158,11,0.2)' :
                                     'rgba(59,130,246,0.2)',
            color:
              t.type === 'success' ? 'var(--color-success)' :
              t.type === 'error'   ? 'var(--color-error)' :
              t.type === 'warning' ? 'var(--color-warning)' :
                                     'var(--color-info)',
          }}>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  )
}
