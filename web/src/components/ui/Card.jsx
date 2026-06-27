import styles from './Card.module.css'

export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={`${styles.card} ${padding ? styles.padded : ''} ${className}`}>
      {children}
    </div>
  )
}