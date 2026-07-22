import { useState, useEffect } from 'react'
import { getProgressSummary, getAllProgress } from '@/api/progress.api'
import { getTaskHistory } from '@/api/tasks.api'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import ProgressBar from '@/components/ui/ProgressBar'
import { useToast } from '@/contexts/ToastContext'
import styles from './Progress.module.css'

export default function Progress() {
  const [summary, setSummary] = useState(null)
  const [roadmapsProgress, setRoadmapsProgress] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date()
        const thirtyDaysAgo = new Date(today)
        thirtyDaysAgo.setDate(today.getDate() - 29) // 30 days window

        const [sumRes, allRes, histRes] = await Promise.all([
          getProgressSummary(),
          getAllProgress(),
          getTaskHistory(thirtyDaysAgo.toISOString().split('T')[0], today.toISOString().split('T')[0])
        ])

        setSummary(sumRes)
        setRoadmapsProgress(allRes)
        setHistory(histRes || [])
      } catch (err) {
        toast.error('Failed to load progress data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [toast])

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size={40} />
      </div>
    )
  }

  // Calendar Heatmap logic
  const getHeatmapColor = (status) => {
    if (status === 'complete') return 'var(--color-success)'
    if (status === 'partial') return 'var(--color-primary)'
    if (status === 'missed') return 'rgba(255,255,255,0.05)'
    return 'rgba(255,255,255,0.05)' // default
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your Progress</h1>
        <p className={styles.subtitle}>Track your overall learning journey.</p>
      </div>

      {/* Overview Stats */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard} glow>
          <div className={styles.statLabel}>Total Tasks Completed</div>
          <div className={styles.statValue}>{summary?.completedTasks || 0}</div>
        </Card>
        <Card className={styles.statCard} glow>
          <div className={styles.statLabel}>Total Skills Mastered</div>
          <div className={styles.statValue}>{summary?.completedSkills || 0}</div>
        </Card>
        <Card className={styles.statCard} glow>
          <div className={styles.statLabel}>Completion Rate</div>
          <div className={styles.statValue}>
            {summary?.totalTasks ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0}%
          </div>
        </Card>
      </div>

      {/* Activity Calendar (Mocked layout using history data) */}
      <div className="section-title">
        <span>📅</span> 30-Day Activity
      </div>
      <Card className={styles.calendarCard}>
        <div className={styles.calendarGrid}>
          {/* We assume history has 30 items. If not, pad it or just render what we have. */}
          {history.length > 0 ? history.map((day, i) => (
            <div 
              key={i} 
              className={styles.calendarDay} 
              style={{ background: getHeatmapColor(day.status) }}
              title={`${day.date}: ${day.completedTasks} tasks done`}
            />
          )) : (
            <p className={styles.emptyText}>No activity data yet.</p>
          )}
        </div>
        <div className={styles.calendarLegend}>
          <div className={styles.legendItem}><div className={styles.legendBox} style={{ background: 'rgba(255,255,255,0.05)' }} /> None</div>
          <div className={styles.legendItem}><div className={styles.legendBox} style={{ background: 'var(--color-primary)' }} /> Partial</div>
          <div className={styles.legendItem}><div className={styles.legendBox} style={{ background: 'var(--color-success)' }} /> Complete</div>
        </div>
      </Card>

      {/* Per Roadmap Progress */}
      <div className="section-title" style={{ marginTop: '1rem' }}>
        <span>🗺️</span> Roadmap Progress
      </div>
      <div className={styles.roadmapsGrid}>
        {roadmapsProgress.map((rp) => {
          // Progress object schema (from server) might have refs or just flat values.
          // Fallback to 0 if undefined.
          const pctTasks = rp.totalTasks ? (rp.completedTasks / rp.totalTasks) * 100 : 0
          const pctSkills = rp.totalSkills ? (rp.completedSkills / rp.totalSkills) * 100 : 0

          return (
            <Card key={rp._id || Math.random()} className={styles.rpCard}>
              <h3 className={styles.rpTitle}>Roadmap ID: {rp.roadmapId?.substring(0,6) || 'Unknown'}</h3>
              <p className={styles.rpSubtitle}>Detailed breakdown</p>
              
              <div className={styles.rpMetrics}>
                <ProgressBar value={pctTasks} max={100} label="Tasks Completion" color="var(--color-primary)" />
                <ProgressBar value={pctSkills} max={100} label="Skills Mastery" color="var(--color-secondary)" />
              </div>
            </Card>
          )
        })}
        {roadmapsProgress.length === 0 && (
          <p className={styles.emptyText}>No roadmaps found to track progress.</p>
        )}
      </div>
    </div>
  )
}
