import styles from './Spinner.module.css'

export default function Spinner({ size = 32, color = 'var(--color-primary)' }) {
  return (
    <div
      className={styles.spinner}
      style={{ width: size, height: size, borderTopColor: color }}
      role="status"
      aria-label="Loading"
    />
  )
}
