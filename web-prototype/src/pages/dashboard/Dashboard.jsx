import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getProgressSummary } from '@/api/progress.api'
import { getTodayTasks, completeTask, skipTask } from '@/api/tasks.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ProgressBar from '@/components/ui/ProgressBar'
import { useToast } from '@/contexts/ToastContext'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

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
        toast.error('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [toast])

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await completeTask(taskId)
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'completed' } : t))
      // Update local user state if xp/streak changed
      if (res.xpEarned || res.streak) {
         updateUser({ xp: (user.xp || 0) + res.xpEarned, streak: res.streak })
         toast.success(`Task completed! +${res.xpEarned} XP`)
      }
    } catch (err) {
      console.error('Failed to complete task', err)
      toast.error('Failed to complete task')
    }
  }

  const handleSkipTask = async (taskId) => {
    try {
        await skipTask(taskId, 'skipped from dashboard')
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'skipped' } : t))
        toast.info('Task skipped')
    } catch (err) {
        console.error('Failed to skip task', err)
        toast.error('Failed to skip task')
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size={40} />
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  const completionRate = summary?.totalTasks ? Math.round((summary.completedTasks / summary.totalTasks) * 100) : 0

  return (
    <div className={`fade-in ${styles.container}`}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>
            Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Explorer'}</span> 👋
          </h1>
          <p className={styles.subtitle}>Ready to make some progress on your career goals today?</p>
        </div>
        <Link to="/roadmaps/generate" className="btn-primary" style={{ textDecoration: 'none' }}>
          <span>✨</span> New Roadmap
        </Link>
      </header>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card className={styles.statCard} glow>
          <div className={styles.statIconWrap} style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--color-primary-light)' }}>🗺️</div>
          <div>
            <div className={styles.statLabel}>Active Roadmaps</div>
            <div className={styles.statValue}>{summary?.totalRoadmaps || 0}</div>
          </div>
        </Card>
        <Card className={styles.statCard} glow>
          <div className={styles.statIconWrap} style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--color-success)' }}>🎯</div>
          <div>
            <div className={styles.statLabel}>Skills Mastered</div>
            <div className={styles.statValue}>{summary?.completedSkills || 0}</div>
          </div>
        </Card>
        <Card className={styles.statCard} glow>
          <div className={styles.statIconWrap} style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--color-secondary)' }}>🔥</div>
          <div>
            <div className={styles.statLabel}>Day Streak</div>
            <div className={styles.statValue}>{user?.streak || 0}</div>
          </div>
        </Card>
        <Card className={styles.statCard} glow>
          <div className={styles.statIconWrap} style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--color-warning)' }}>⚡</div>
          <div>
            <div className={styles.statLabel}>Total XP</div>
            <div className={styles.statValue}>{user?.xp || 0}</div>
          </div>
        </Card>
      </div>

      <div className={styles.mainGrid}>
        {/* Today's Tasks */}
        <div className={styles.tasksSection}>
          <div className="section-title">
            <span>✅</span> Today's Tasks
          </div>
          
          {tasks.length === 0 ? (
            <Card className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎉</div>
              <h3>All caught up!</h3>
              <p>You have no pending tasks for today. Enjoy your free time or explore your roadmaps.</p>
              <Link to="/roadmaps" className="btn-secondary" style={{ marginTop: '1rem', textDecoration: 'none' }}>
                View Roadmaps
              </Link>
            </Card>
          ) : (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <Card key={task._id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <span className={`badge ${styles.taskTypeBadge}`}>{task.taskType}</span>
                    <span className={styles.xpBadge}>+{task.xpReward} XP</span>
                  </div>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <p className={styles.taskDesc}>{task.description}</p>
                  
                  {task.resourceUrl && (
                    <a href={task.resourceUrl} target="_blank" rel="noreferrer" className={styles.taskLink}>
                      View Resource ↗
                    </a>
                  )}
                  
                  <div className={styles.taskActions}>
                    {task.status === 'completed' ? (
                      <span className="badge badge-success">✓ Completed</span>
                    ) : task.status === 'skipped' ? (
                      <span className="badge badge-muted">Skipped</span>
                    ) : (
                      <>
                        <Button variant="primary" size="sm" onClick={() => handleCompleteTask(task._id)}>
                          Complete
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleSkipTask(task._id)}>
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Progress Overview */}
        <div className={styles.progressSection}>
          <div className="section-title">
            <span>📈</span> Overview
          </div>
          <Card className={styles.progressCard}>
            <div className={styles.ringContainer}>
              <svg viewBox="0 0 100 100" className={styles.progressRing}>
                <circle cx="50" cy="50" r="40" className={styles.ringBg} />
                <circle 
                  cx="50" cy="50" r="40" 
                  className={styles.ringFill} 
                  style={{ strokeDashoffset: 251.2 - (251.2 * completionRate) / 100 }}
                />
              </svg>
              <div className={styles.ringText}>
                <span className={styles.ringVal}>{completionRate}%</span>
                <span className={styles.ringLabel}>Completed</span>
              </div>
            </div>
            
            <div className={styles.progressStats}>
              <div className={styles.pStat}>
                <span className={styles.pLabel}>Total Tasks</span>
                <span className={styles.pVal}>{summary?.totalTasks || 0}</span>
              </div>
              <div className={styles.pStat}>
                <span className={styles.pLabel}>Completed</span>
                <span className={styles.pVal}>{summary?.completedTasks || 0}</span>
              </div>
              <div className={styles.pStat}>
                <span className={styles.pLabel}>Skipped</span>
                <span className={styles.pVal}>{summary?.skippedTasks || 0}</span>
              </div>
            </div>
            
            <div style={{ marginTop: '1.5rem', width: '100%' }}>
              <ProgressBar value={completionRate} label="Overall Journey" color="var(--color-primary-light)" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
