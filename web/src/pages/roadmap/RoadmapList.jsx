import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getRoadmaps } from '@/api/roadmap.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import styles from './Roadmap.module.css'

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoadmaps()
      .then((res) => setRoadmaps(res.data.roadmaps || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>My Roadmaps</h1>
          <p className={styles.sub}>View and manage your career roadmaps.</p>
        </div>
        <Link to="/assessment">
          <Button>+ New Roadmap</Button>
        </Link>
      </div>

      {loading ? (
        <div className={styles.center}><Spinner /></div>
      ) : roadmaps.length === 0 ? (
        <Card>
          <div className={styles.empty}>
            <p>No roadmaps yet.</p>
            <Link to="/assessment"><Button>Generate your first roadmap</Button></Link>
          </div>
        </Card>
      ) : (
        <div className={styles.grid}>
          {roadmaps.map((rm) => (
            <Link to={`/roadmaps/${rm._id}`} key={rm._id} className={styles.cardLink}>
              <Card>
                <h3 className={styles.rmTitle}>{rm.targetCareer}</h3>
                <p className={styles.rmMeta}>{rm.phases?.length || 0} phases</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}