import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getRoadmaps, deleteRoadmap } from '@/api/roadmap.api'
import { getProgressSummary } from '@/api/progress.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ProgressBar from '@/components/ui/ProgressBar'
import { useToast } from '@/contexts/ToastContext'
import styles from './Roadmap.module.css'

export default function RoadmapList() {
  const [roadmaps, setRoadmaps] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    fetchRoadmaps()
  }, [])

  const fetchRoadmaps = async () => {
    try {
      const data = await getRoadmaps()
      setRoadmaps(data)
    } catch (err) {
      toast.error('Failed to load roadmaps')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.preventDefault() // prevent navigating to detail
    if (!window.confirm('Are you sure you want to delete this roadmap?')) return
    
    try {
      await deleteRoadmap(id)
      setRoadmaps(prev => prev.filter(r => r._id !== id))
      toast.success('Roadmap deleted')
    } catch (err) {
      toast.error('Failed to delete roadmap')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Roadmaps</h1>
          <p className={styles.subtitle}>Your personalized learning paths</p>
        </div>
        <Link to="/roadmaps/generate" className="btn-primary" style={{ textDecoration: 'none' }}>
          <span>✨</span> Generate New
        </Link>
      </div>

      {roadmaps.length === 0 ? (
        <Card className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺️</div>
          <h2>No roadmaps yet</h2>
          <p>Generate your first AI-powered roadmap to kickstart your career journey.</p>
          <Link to="/roadmaps/generate" className="btn-primary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
            Generate Roadmap
          </Link>
        </Card>
      ) : (
        <div className={styles.grid}>
          {roadmaps.map(roadmap => (
            <Link key={roadmap._id} to={`/roadmaps/${roadmap._id}`} className={styles.cardLink}>
              <Card className={styles.roadmapCard} glow>
                <div className={styles.cardTop}>
                  <div>
                    <h3 className={styles.cardTitle}>{roadmap.targetCareer}</h3>
                    <div className={styles.cardTags}>
                      <span className="badge badge-primary">{roadmap.skillLevel}</span>
                      <span className="badge badge-muted">{roadmap.duration}</span>
                    </div>
                  </div>
                  <button 
                    className={styles.deleteBtn} 
                    onClick={(e) => handleDelete(roadmap._id, e)}
                    title="Delete Roadmap"
                  >
                    🗑
                  </button>
                </div>
                
                <p className={styles.cardDesc}>
                  {roadmap.summary || 'A personalized journey to your career goal.'}
                </p>
                
                <div className={styles.cardBottom}>
                  <div className={styles.phaseInfo}>
                    {roadmap.phases?.length || 0} Phases
                  </div>
                  <div style={{ flex: 1 }}>
                     {/* For a real progress bar, we'd need progress summary per roadmap. 
                         Just a placeholder for now since the API `/roadmaps` doesn't include progress %. 
                         We'd fetch /progress/:id on the detail page. */}
                     <div className={styles.placeholderProgress} />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
