import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import styles from './Landing.module.css'

const STEPS = [
  { label: 'Assess your goal', desc: 'Tell us your target career, skill level, and how much time you have.' },
  { label: 'Get your roadmap', desc: 'AI builds a phased plan with sub-topics and learning objectives.' },
  { label: 'Complete daily tasks', desc: 'Reading, video, coding, and project tasks sized to your schedule.' },
  { label: 'Pass phase quizzes', desc: 'Prove you\'ve got it before the next phase unlocks.' },
]

const FEATURES = [
  { icon: '✨', title: 'AI Roadmaps', desc: 'A personalized, phased learning path generated for your exact career goal.' },
  { icon: '✅', title: 'Daily Tasks', desc: 'Bite-sized reading, video, and coding tasks that fit your available hours.' },
  { icon: '🧠', title: 'Phase Quizzes', desc: 'Check your understanding before moving on — no skipping ahead unprepared.' },
  { icon: '🔥', title: 'Streaks', desc: 'Stay consistent with daily streaks and XP that track real progress.' },
]

export default function Landing() {
  return (
    <div className={styles.page}>
      <header className={styles.nav}>
        <div className={styles.navBrand}>
          <span className={styles.logoIcon}>🧭</span>
          <span className={styles.logoText}>CareerPilot</span>
        </div>
        <nav className={styles.navLinks}>
          <a href="#how-it-works">How it works</a>
          <a href="#features">Features</a>
        </nav>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.signInLink}>Sign in</Link>
          <Link to="/register"><Button>Get Started</Button></Link>
        </div>
      </header>

      <section className={styles.hero}>
        <span className={styles.eyebrow}>AI-powered career roadmaps</span>
        <h1 className={styles.heroTitle}>
          Turn any career goal into<br />a roadmap you'll actually follow
        </h1>
        <p className={styles.heroSub}>
          Tell us where you want to go. We'll build the phases, daily tasks,
          and quizzes to get you there — one day at a time.
        </p>
        <div className={styles.heroActions}>
          <Link to="/register"><Button>Generate My Roadmap</Button></Link>
          <Link to="/login" className={styles.secondaryLink}>Already have an account? Sign in →</Link>
        </div>

        <div className={styles.statsBar}>
          <div><strong>12K+</strong><span>Learners</span></div>
          <div className={styles.divider} />
          <div><strong>98%</strong><span>Satisfaction</span></div>
          <div className={styles.divider} />
          <div><strong>4.9★</strong><span>Rating</span></div>
        </div>
      </section>

      <section id="how-it-works" className={styles.steps}>
        <h2 className={styles.sectionTitle}>How CareerPilot works</h2>
        <div className={styles.stepPath}>
          {STEPS.map((step, i) => (
            <div className={styles.stepNode} key={step.label}>
              <div className={styles.stepDot}>{i + 1}</div>
              {i < STEPS.length - 1 && <div className={styles.stepLine} />}
              <p className={styles.stepLabel}>{step.label}</p>
              <p className={styles.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className={styles.features}>
        <h2 className={styles.sectionTitle}>Everything you need to stay on track</h2>
        <div className={styles.featureGrid}>
          {FEATURES.map((f) => (
            <div className={styles.featureCard} key={f.title}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <h3 className={styles.featureTitle}>{f.title}</h3>
              <p className={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.cta}>
        <h2>Ready to build your roadmap?</h2>
        <p>It takes less than two minutes to get started.</p>
        <Link to="/register"><Button>Get Started Free</Button></Link>
      </section>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} CareerPilot</span>
        <div className={styles.footerLinks}>
          <Link to="/login">Sign in</Link>
          <Link to="/register">Register</Link>
        </div>
      </footer>
    </div>
  )
}