import { NavLink } from 'react-router-dom'
import { useContext, useState, useEffect, useCallback } from 'react'
import { AuthContext } from '@/contexts/AuthContext'
import styles from './Sidebar.module.css'

const COLLAPSED_KEY = 'ag-sidebar-collapsed'
const EXPANDED_WIDTH = '260px'
const COLLAPSED_WIDTH = '78px'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/assessment',
    label: 'Assessment',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    to: '/roadmaps',
    label: 'Roadmaps',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    to: '/resources',
    label: 'Resources',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="12" y1="6" x2="12" y2="12" />
        <line x1="9" y1="9" x2="15" y2="9" />
      </svg>
    ),
  },
]

/* Tiny star particles for visual depth */
function StarField() {
  return (
    <div className={styles.starField} aria-hidden="true">
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className={styles.star}
          style={{
            '--x': `${Math.random() * 100}%`,
            '--y': `${Math.random() * 100}%`,
            '--size': `${1 + Math.random() * 2}px`,
            '--delay': `${Math.random() * 6}s`,
            '--duration': `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Sidebar() {
  const { user } = useContext(AuthContext)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSED_KEY) === 'true' } catch { return false }
  })

  // Sync CSS custom property on <html> so MainLayout margin responds automatically
  const syncWidth = useCallback((isCollapsed) => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH
    )
  }, [])

  // Set initial width on mount and whenever collapsed changes
  useEffect(() => {
    syncWidth(collapsed)
  }, [collapsed, syncWidth])

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try { localStorage.setItem(COLLAPSED_KEY, String(next)) } catch { /* noop */ }
      return next
    })
  }

  const sidebarClass = [styles.sidebar, collapsed ? styles.collapsed : ''].join(' ')

  return (
    <aside className={sidebarClass} id="ag-sidebar">
      {/* Animated star particles behind the glass */}
      <StarField />

      {/* Outer glow accents */}
      <div className={styles.glowOrb1} aria-hidden="true" />
      <div className={styles.glowOrb2} aria-hidden="true" />

      {/* ─── Logo Area ──────────────────────────── */}
      <div className={styles.logoArea}>
        <div className={styles.logoMark}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className={styles.logoSvg}>
            <defs>
              <linearGradient id="agGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#00f0ff" />
              </linearGradient>
            </defs>
            <circle cx="18" cy="18" r="16" stroke="url(#agGrad)" strokeWidth="1.5" fill="none" opacity="0.6" />
            <circle cx="18" cy="18" r="11" stroke="url(#agGrad)" strokeWidth="1" fill="none" opacity="0.3" />
            <path
              d="M12 24L18 8L24 24M14.5 19H21.5"
              stroke="url(#agGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className={styles.logoText}>
          <span className={styles.logoPrimary}>Anti-Gravity</span>
          <span className={styles.logoSub}>CareerPilot</span>
        </div>
      </div>

      {/* Separator — glowing line */}
      <div className={styles.separator} />

      {/* ─── Navigation ─────────────────────────── */}
      <nav className={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              [styles.navItem, isActive ? styles.active : ''].join(' ')
            }
            title={collapsed ? item.label : undefined}
          >
            <span className={styles.navGlow} aria-hidden="true" />
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
            <span className={styles.navIndicator} aria-hidden="true" />
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className={styles.spacer} />

      {/* ─── User Profile Card ──────────────────── */}
      <div className={styles.profileCard}>
        <div className={styles.profileGlow} aria-hidden="true" />
        <div className={styles.avatarRing}>
          <div className={styles.avatar}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </div>
        <div className={styles.profileInfo}>
          <span className={styles.profileName}>{user?.name || 'Astronaut'}</span>
          <span className={styles.profileRole}>{user?.email || 'Explorer'}</span>
        </div>
        <NavLink to="/profile" className={styles.profileSettingsBtn} aria-label="Settings">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </NavLink>
      </div>

      {/* ─── Collapse Toggle ────────────────────── */}
      <button
        className={styles.collapseBtn}
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.collapseBtnIcon}
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
    </aside>
  )
}