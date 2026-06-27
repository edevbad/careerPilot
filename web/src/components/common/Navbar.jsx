import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <span className={styles.greeting}>
          Welcome back, <strong>{user?.name || 'User'}</strong>
        </span>
      </div>
      <div className={styles.right}>
        <span className={styles.email}>{user?.email}</span>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </header>
  )
}