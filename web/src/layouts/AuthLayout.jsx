import { Outlet, Link } from 'react-router-dom'
import styles from './AuthLayout.module.css'

export default function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.brandPanel}>
        <div className={styles.brandContent}>
          <div className={styles.logo}>🧭</div>
          <h1 className={styles.brandName}>CareerPilot</h1>
          <p className={styles.tagline}>Your personalized path to a successful career.</p>
        </div>
      </div>
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}