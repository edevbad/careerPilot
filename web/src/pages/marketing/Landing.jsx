import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import styles from './Landing.module.css'

const WAYPOINTS = [
  {
    code: 'WP-00',
    label: 'Start',
    title: 'Tell us where you\u2019re headed',
    body: 'A short assessment \u2014 target role, current skill level, hours you can give it each week. No account required to see your first roadmap.',
  },
  {
    code: 'WP-01',
    label: 'Phase 1',
    title: 'Get a roadmap, not a reading list',
    body: 'AI breaks your goal into ordered phases with real prerequisites \u2014 each one scoped to what you actually need before the next.',
  },
  {
    code: 'GATE',
    label: 'Quiz Gate',
    title: 'Prove it before you move on',
    body: 'Every phase ends in a graded quiz. Pass and the next phase unlocks. Fail and you get a targeted review list \u2014 no guessing what to restudy.',
  },
  {
    code: 'WP-02',
    label: 'Daily Tasks',
    title: 'Show up, check things off',
    body: 'Reading, video, coding, and project tasks sized to your daily hours \u2014 each one worth XP, with a streak that tracks the days you didn\u2019t skip.',
  },
]

const INSTRUMENTS = [
  {
    tag: 'TASK LOG',
    title: 'Daily tasks, sized to your week',
    body: 'Tell it you have 1 hour or 4 \u2014 it hands you 3 to 7 tasks a day instead of a syllabus you\u2019ll never finish.',
  },
  {
    tag: 'ROUTE MAP',
    title: 'Phases that actually gate',
    body: 'Locked phases stay locked. No skipping ahead to the fun part before the fundamentals are done.',
  },
  {
    tag: 'CHECKPOINT',
    title: 'Quizzes with a real bar',
    body: 'A passing score, a 24-hour cooldown on retakes, and study suggestions built from exactly what you missed.',
  },
]

export default function Landing() {
  const { isAuthenticated } = useAuth()
  const primaryHref = isAuthenticated ? '/dashboard' : '/register'
  const primaryLabel = isAuthenticated ? 'Go to dashboard' : 'Plot your course'

  return (
    <div className={styles.page}>
      {/* ── Nav ─────────────────────────────────────────── */}
      <header className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <CompassMark />
            <span>CareerPilot</span>
          </div>
          <nav className={styles.navLinks}>
            <a href="#route">The Route</a>
            <a href="#instruments">Instruments</a>
          </nav>
          <div className={styles.navActions}>
            {!isAuthenticated && (
              <Link to="/login" className={styles.navSignIn}>Sign in</Link>
            )}
            <Link to={primaryHref} className={styles.navCta}>{primaryLabel}</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>FLIGHT PLAN &middot; CAREER CHANGE</p>
            <h1 className={styles.headline}>
              Chart a course to the
              <span className={styles.headlineAccent}> career you\u2019re aiming for.</span>
            </h1>
            <p className={styles.subhead}>
              CareerPilot turns a target role into an ordered flight plan \u2014 phases,
              daily tasks, and quiz gates that actually check you know the material
              before you move on.
            </p>
            <div className={styles.heroActions}>
              <Link to={primaryHref} className={styles.ctaPrimary}>{primaryLabel}</Link>
              <a href="#route" className={styles.ctaSecondary}>See how it routes &darr;</a>
            </div>
            <div className={styles.heroReadout}>
              <ReadoutItem label="HDG" value="042\u00b0" />
              <ReadoutItem label="PACE" value="SELF-SET" />
              <ReadoutItem label="GATES" value="PASS / RETRY" />
            </div>
          </div>

          <FlightPath />
        </div>
      </section>

      {/* ── The Route ───────────────────────────────────── */}
      <section id="route" className={styles.route}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionEyebrow}>THE ROUTE</p>
          <h2 className={styles.sectionTitle}>Four legs. One course.</h2>
          <p className={styles.sectionSub}>
            This is the actual loop \u2014 not marketing steps, the order the product runs in.
          </p>
        </div>

        <ol className={styles.legList}>
          {WAYPOINTS.map((wp, i) => (
            <li key={wp.code} className={styles.leg}>
              <div className={styles.legMarker}>
                <span className={styles.legCode}>{wp.code}</span>
                {i < WAYPOINTS.length - 1 && <span className={styles.legLine} aria-hidden="true" />}
              </div>
              <div className={styles.legBody}>
                <p className={styles.legLabel}>{wp.label}</p>
                <h3 className={styles.legTitle}>{wp.title}</h3>
                <p className={styles.legText}>{wp.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Instruments ─────────────────────────────────── */}
      <section id="instruments" className={styles.instruments}>
        <div className={styles.sectionHead}>
          <p className={styles.sectionEyebrow}>ON THE PANEL</p>
          <h2 className={styles.sectionTitle}>What you\u2019re actually looking at day to day</h2>
        </div>

        <div className={styles.instrumentGrid}>
          {INSTRUMENTS.map((inst) => (
            <div key={inst.tag} className={styles.instrumentCard}>
              <span className={styles.instrumentTag}>{inst.tag}</span>
              <h3 className={styles.instrumentTitle}>{inst.title}</h3>
              <p className={styles.instrumentText}>{inst.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Closing CTA ─────────────────────────────────── */}
      <section className={styles.closing}>
        <div className={styles.closingInner}>
          <p className={styles.eyebrow}>READY WHEN YOU ARE</p>
          <h2 className={styles.closingTitle}>Your first roadmap takes about two minutes to generate.</h2>
          <Link to={primaryHref} className={styles.ctaPrimary}>{primaryLabel}</Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.logo}>
            <CompassMark small />
            <span>CareerPilot</span>
          </div>
          <p className={styles.footerNote}>Plan the route. Do the work. Pass the gate.</p>
        </div>
      </footer>
    </div>
  )
}

function ReadoutItem({ label, value }) {
  return (
    <div className={styles.readoutItem}>
      <span className={styles.readoutLabel}>{label}</span>
      <span className={styles.readoutValue}>{value}</span>
    </div>
  )
}

function CompassMark({ small }) {
  const size = small ? 20 : 26
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="14.5" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <path d="M20 12L14 18M20 12L14.5 13.5L14 18L18.5 17.5L20 12Z"
        fill="var(--accent-brass, #D9A441)" stroke="var(--accent-brass, #D9A441)" strokeLinejoin="round" />
    </svg>
  )
}

function FlightPath() {
  return (
    <div className={styles.flightPathWrap} aria-hidden="true">
      <svg viewBox="0 0 420 460" className={styles.flightPathSvg} preserveAspectRatio="xMidYMid meet">
        <path
          className={styles.routePath}
          d="M40 420 C 40 340, 140 340, 140 280 S 260 220, 260 160 S 380 100, 380 40"
          fill="none"
        />
        {[
          { x: 40, y: 420, code: 'WP-00' },
          { x: 140, y: 280, code: 'WP-01' },
          { x: 260, y: 160, code: 'GATE' },
          { x: 380, y: 40, code: 'WP-02' },
        ].map((p) => (
          <g key={p.code} transform={`translate(${p.x}, ${p.y})`}>
            <circle r="5" className={styles.routeDot} />
            <circle r="10" className={styles.routeDotRing} />
            <text x="14" y="4" className={styles.routeLabel}>{p.code}</text>
          </g>
        ))}
      </svg>
    </div>
  )
}