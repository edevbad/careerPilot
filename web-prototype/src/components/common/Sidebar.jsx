import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import styles from './Sidebar.module.css'

const NAV = [
  { to: '/dashboard',  label: 'Dashboard',  icon: '⊞' },
  { to: '/roadmaps',   label: 'Roadmaps',   icon: '🗺' },
  { to: '/tasks',      label: 'Daily Tasks', icon: '✅' },
  { to: '/progress',   label: 'Progress',    icon: '📈' },
  { to: '/profile',    label: 'Profile',     icon: '👤' },
]

export default function Sidebar() {
  const { logout, user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const handleLogout = async () => {
    await logout()
    toast.info('Logged out successfully')
    navigate('/login')
  }

  return (
    <aside className={styles.sidebar}>
      {/* Brand */}
      <div className={styles.brand}>
        <div className={styles.brandIcon}>🧭</div>
        <div>
          <div className={styles.brandName}>CareerPilot</div>
          <div className={styles.brandTag}>Web Prototype</div>
        </div>
      </div>

      {/* User chip */}
      <div className={styles.userChip}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user?.name || 'User'}</div>
          <div className={styles.userRole}>{user?.careerGoal || 'Career Explorer'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className={styles.nav}>
        <p className={styles.navSection}>Navigation</p>
        {NAV.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.navIcon}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <span>⎋</span> Logout
        </button>
      </div>
    </aside>
  )
}
