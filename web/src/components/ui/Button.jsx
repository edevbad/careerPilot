import styles from './Button.module.css'

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${styles.btn}
        ${styles[variant]}
        ${fullWidth ? styles.fullWidth : ''}
        ${loading ? styles.loading : ''}
      `}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  )
}