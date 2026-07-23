import { Outlet, Link } from 'react-router-dom'
import styles from './AuthLayout.module.css'

const FEATURES = [
  { icon: '🤖', title: 'AI-Generated Roadmaps', desc: 'Get a personalized learning path built just for your goals' },
  { icon: '✅', title: 'Daily Tasks & XP', desc: 'Stay on track with bite-sized tasks and an XP reward system' },
  { icon: '🧪', title: 'Phase Quizzes', desc: 'Prove your knowledge and unlock the next stage of your career journey' },
  { icon: '📈', title: 'Progress Analytics', desc: 'Visualize your growth with rich charts and completion tracking' },
]

export default function AuthLayout() {
  return (
    <div className={styles.wrapper}>
      {/* Brand panel */}
      <div className={styles.brandPanel}>
        <div className={styles.panelGlow} />
        <div className={styles.brandContent}>
          <div className={styles.logoWrap}>
            <span className={styles.logoEmoji}>🧭</span>
          </div>
          <h1 className={styles.brandName}>CareerPilot</h1>
          <p className={styles.tagline}>Navigate your career with AI-powered precision.</p>

          <div className={styles.features}>
            {FEATURES.map((f) => (
              <div key={f.icon} className={styles.feature}>
                <span className={styles.featureIcon}>{f.icon}</span>
                <div>
                  <div className={styles.featureTitle}>{f.title}</div>
                  <div className={styles.featureDesc}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
