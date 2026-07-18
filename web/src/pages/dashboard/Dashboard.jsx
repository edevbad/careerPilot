import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { getProgressSummary } from '@/api/progress.api'
import { getTodayTasks, completeTask } from '@/api/tasks.api'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()
  const [summary, setSummary] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [progressRes, tasksRes] = await Promise.all([
          getProgressSummary(),
          getTodayTasks()
        ])
        setSummary(progressRes)
        setTasks(tasksRes.tasks || [])
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [])

  const handleCompleteTask = async (taskId) => {
    try {
      await completeTask(taskId)
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'completed' } : t))
    } catch (err) {
      console.error('Failed to complete task', err)
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading your dashboard...</div>
  }

  return (
    <div className={`${styles.page} fade-in`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.heading}>Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Explorer'}</span></h1>
          <p className={styles.sub}>Here's an overview of your career progress today.</p>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🗺️</div>
          <div>
            <p className={styles.statLabel}>Active Roadmaps</p>
            <p className={styles.statValue}>{summary?.totalRoadmaps || 0}</p>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div>
            <p className={styles.statLabel}>Skills Mastered</p>
            <p className={styles.statValue}>{summary?.completedSkills || 0}</p>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>⚡</div>
          <div>
            <p className={styles.statLabel}>Current Streak</p>
            <p className={styles.statValue}>{user?.streak || 0} Days</p>
          </div>
        </Card>
        <Card className={styles.statCard}>
          <div className={styles.statIcon}>⭐</div>
          <div>
            <p className={styles.statLabel}>Total XP</p>
            <p className={styles.statValue}>{user?.xp || 0}</p>
          </div>
        </Card>
      </div>

      <div className={styles.contentGrid}>
        <div className={styles.tasksSection}>
          <h2 className={styles.sectionTitle}>Today's Tasks</h2>
          {tasks.length === 0 ? (
            <Card>
              <p className={styles.emptyState}>No tasks for today. Take a break!</p>
            </Card>
          ) : (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <Card key={task._id} padding={false} className={styles.taskCard}>
                  <div className={styles.taskContent}>
                    <div className={styles.taskHeader}>
                      <span className={styles.taskType}>{task.taskType}</span>
                      <span className={styles.xpBadge}>+{task.xpReward} XP</span>
                    </div>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <p className={styles.taskDesc}>{task.description}</p>
                  </div>
                  <div className={styles.taskActions}>
                    {task.status === 'completed' ? (
                      <span className={styles.completedBadge}>✓ Completed</span>
                    ) : (
                      <button 
                        className="btn-primary" 
                        onClick={() => handleCompleteTask(task._id)}
                      >
                        Complete Task
                      </button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className={styles.progressSection}>
          <h2 className={styles.sectionTitle}>Recent Progress</h2>
          <Card className={styles.progressCard}>
            <div className={styles.circularProgress}>
              {/* Placeholder for circular progress chart */}
              <span className={styles.progressPercentage}>
                {Math.round((summary?.completedTasks / Math.max(1, summary?.totalTasks)) * 100) || 0}%
              </span>
            </div>
            <p className={styles.progressText}>Overall completion rate</p>
          </Card>
        </div>
      </div>
    </div>
  )
}