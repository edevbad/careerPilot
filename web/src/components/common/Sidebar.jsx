import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.css'

const navItems = [
  { to: '/dashboard',   label: 'Dashboard',   icon: '📊' },
  { to: '/assessment',  label: 'Assessment',  icon: '📝' },
  { to: '/roadmaps',    label: 'Roadmaps',    icon: '🗺️' },
  { to: '/progress',    label: 'Progress',    icon: '📈' },
  { to: '/resources',   label: 'Resources',   icon: '📚' },
  { to: '/profile',     label: 'Profile',     icon: '👤' },
]

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>🧭</span>
        <span className={styles.logoText}>CareerPilot</span>
      </div>
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}