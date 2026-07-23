import Spinner from './Spinner'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const base    = `btn-${variant}`
  const sizes   = { sm: { padding: '0.5rem 1rem', fontSize: '0.8rem' }, md: {}, lg: { padding: '0.9rem 2rem', fontSize: '1rem' } }
  const sizeStyle = sizes[size] || {}

  return (
    <button
      type={type}
      className={`${base} ${className}`}
      style={{ ...sizeStyle, minWidth: isLoading ? 120 : undefined }}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? <><Spinner size={16} color="white" /> Loading…</> : children}
    </button>
  )
}
