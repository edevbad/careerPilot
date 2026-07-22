import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import styles from './Topbar.module.css'

const TITLES = {
  '/dashboard':        'Dashboard',
  '/roadmaps':         'My Roadmaps',
  '/roadmaps/generate':'Generate Roadmap',
  '/tasks':            'Daily Tasks',
  '/progress':         'Progress',
  '/profile':          'Profile',
}

export default function Topbar() {
  const { pathname } = useLocation()
  const { user } = useAuth()

  const title = Object.entries(TITLES).find(([path]) =>
    pathname === path || pathname.startsWith(path + '/')
  )?.[1] || 'CareerPilot'

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h2 className={styles.pageTitle}>{title}</h2>
      </div>
      <div className={styles.right}>
        <div className={styles.xpChip}>
          <span className={styles.xpIcon}>⚡</span>
          <span>{user?.xp ?? 0} XP</span>
        </div>
        <Link to="/profile" className={styles.avatarLink}>
          <div className={styles.avatar}>
            {user?.name?.charAt(0).toUpperCase() || '?'}
          </div>
        </Link>
      </div>
    </header>
  )
}
