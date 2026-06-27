import Card from '@/components/ui/Card'
import styles from './Progress.module.css'

export default function Progress() {
  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Learning Progress</h1>
      <p className={styles.sub}>Track how far you've come across all your roadmaps.</p>
      <Card>
        <p className={styles.placeholder}>
          Progress analytics will appear here once you've started marking skills complete in your roadmaps.
        </p>
      </Card>
    </div>
  )
}