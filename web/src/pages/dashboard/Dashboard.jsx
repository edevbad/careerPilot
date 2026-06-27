import Card from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>
      <p className={styles.sub}>Here's an overview of your career progress.</p>

      <div className={styles.statsGrid}>
        <Card>
          <p className={styles.statLabel}>Active Roadmaps</p>
          <p className={styles.statValue}>—</p>
        </Card>
        <Card>
          <p className={styles.statLabel}>Skills Completed</p>
          <p className={styles.statValue}>—</p>
        </Card>
        <Card>
          <p className={styles.statLabel}>Overall Progress</p>
          <p className={styles.statValue}>—%</p>
        </Card>
        <Card>
          <p className={styles.statLabel}>Resources Saved</p>
          <p className={styles.statValue}>—</p>
        </Card>
      </div>
    </div>
  )
}