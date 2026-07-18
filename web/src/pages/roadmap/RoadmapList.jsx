import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoadmaps } from '@/api/roadmap.api'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import styles from './Roadmap.module.css'

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoadmaps()
      .then((res) => setRoadmaps(res.data.data.roadmaps || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={`${styles.page} fade-in`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Career <span className="text-gradient">Roadmaps</span></h1>
          <p className={styles.sub}>View and manage your customized learning paths.</p>
        </div>
        <Link to="/assessment" className="btn-primary">
          <span>+</span> New Roadmap
        </Link>
      </div>

      {loading ? (
        <div className={styles.center}><Spinner /></div>
      ) : roadmaps.length === 0 ? (
        <Card className={styles.emptyCard}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🧭</div>
            <h3>No roadmaps found</h3>
            <p className={styles.emptyText}>Generate a personalized career roadmap to kickstart your journey.</p>
            <Link to="/assessment" className="btn-primary">Generate Roadmap</Link>
          </div>
        </Card>
      ) : (
        <div className={styles.grid}>
          {roadmaps.map((rm) => (
            <Link to={`/roadmaps/${rm._id}`} key={rm._id} className={styles.cardLink}>
              <Card className={styles.roadmapCard}>
                <div className={styles.cardTop}>
                  <div className={styles.iconWrapper}>🎓</div>
                  <span className={styles.statusBadge}>Active</span>
                </div>
                <h3 className={styles.rmTitle}>{rm.targetCareer}</h3>
                <div className={styles.rmDetails}>
                  <span className={styles.rmMeta}>📊 {rm.skillLevel}</span>
                  <span className={styles.rmMeta}>⏱️ {rm.duration}</span>
                </div>
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{width: '25%'}}></div>
                  </div>
                  <span className={styles.progressText}>25% Complete</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}