import styles from './Card.module.css'

export default function Card({ children, className = '', style, onClick, glow = false }) {
  return (
    <div
      className={`glass-panel ${styles.card} ${glow ? styles.glow : ''} ${onClick ? styles.clickable : ''} ${className}`}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
