import { useState, useEffect } from 'react'
import { getTodayTasks, completeTask, skipTask } from '@/api/tasks.api'
import { getRoadmaps } from '@/api/roadmap.api'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import styles from './Tasks.module.css'

export default function Tasks() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [tasks, setTasks] = useState([])
  const [roadmaps, setRoadmaps] = useState([])
  const [selectedRoadmapId, setSelectedRoadmapId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    try {
      const rmData = await getRoadmaps()
      setRoadmaps(rmData)
      if (rmData.length > 0) {
        setSelectedRoadmapId(rmData[0]._id)
        await fetchTasks(rmData[0]._id)
      } else {
        setLoading(false)
      }
    } catch (err) {
      toast.error('Failed to load tasks data')
      setLoading(false)
    }
  }

  const fetchTasks = async (rId) => {
    setLoading(true)
    try {
      const data = await getTodayTasks(rId)
      setTasks(data.tasks || [])
    } catch (err) {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleRoadmapChange = (e) => {
    const rId = e.target.value
    setSelectedRoadmapId(rId)
    fetchTasks(rId)
  }

  const handleCompleteTask = async (taskId) => {
    try {
      const res = await completeTask(taskId)
      setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'completed' } : t))
      if (res.xpEarned || res.streak) {
         updateUser({ xp: (user.xp || 0) + res.xpEarned, streak: res.streak })
         toast.success(`Task completed! +${res.xpEarned} XP`)
      }
    } catch (err) {
      toast.error('Failed to complete task')
    }
  }

  const handleSkipTask = async (taskId) => {
    try {
        await skipTask(taskId, 'skipped')
        setTasks(tasks.map(t => t._id === taskId ? { ...t, status: 'skipped' } : t))
        toast.info('Task skipped')
    } catch (err) {
        toast.error('Failed to skip task')
    }
  }

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const completedCount = tasks.filter(t => t.status === 'completed').length

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Daily Tasks</h1>
          <p className={styles.subtitle}>Complete your tasks to maintain your streak and earn XP.</p>
        </div>
        
        {roadmaps.length > 0 && (
          <div className={styles.filterWrap}>
            <label>Roadmap:</label>
            <select value={selectedRoadmapId} onChange={handleRoadmapChange} className={styles.select}>
              {roadmaps.map(r => (
                <option key={r._id} value={r._id}>{r.targetCareer}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <Spinner size={40} />
        </div>
      ) : roadmaps.length === 0 ? (
        <Card className={styles.emptyState}>
          <div className={styles.emptyIcon}>🗺️</div>
          <h2>No Roadmaps Found</h2>
          <p>Generate a roadmap first to get daily tasks.</p>
        </Card>
      ) : (
        <div className={styles.content}>
          <div className={styles.summaryBar}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Today</span>
              <span className={styles.summaryVal}>{tasks.length}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Completed</span>
              <span className={`${styles.summaryVal} ${styles.textSuccess}`}>{completedCount}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Pending</span>
              <span className={`${styles.summaryVal} ${styles.textWarning}`}>{pendingCount}</span>
            </div>
          </div>

          {tasks.length === 0 ? (
            <Card className={styles.emptyState}>
              <div className={styles.emptyIcon}>🎉</div>
              <h3>No tasks for today!</h3>
              <p>You have completed everything or there are no tasks scheduled.</p>
            </Card>
          ) : (
            <div className={styles.taskList}>
              {tasks.map(task => (
                <Card key={task._id} className={styles.taskCard}>
                  <div className={styles.taskInfo}>
                    <div className={styles.taskHeader}>
                      <span className={`badge badge-primary`}>{task.taskType}</span>
                      <span className={styles.xpBadge}>+{task.xpReward} XP</span>
                    </div>
                    <h3 className={styles.taskTitle}>{task.title}</h3>
                    <p className={styles.taskDesc}>{task.description}</p>
                    {task.resourceUrl && (
                      <a href={task.resourceUrl} target="_blank" rel="noreferrer" className={styles.taskLink}>
                        View Resource ↗
                      </a>
                    )}
                  </div>
                  
                  <div className={styles.taskActions}>
                    {task.status === 'completed' ? (
                      <span className="badge badge-success" style={{ padding: '0.5rem 1rem' }}>✓ Completed</span>
                    ) : task.status === 'skipped' ? (
                      <span className="badge badge-muted" style={{ padding: '0.5rem 1rem' }}>Skipped</span>
                    ) : (
                      <>
                        <Button variant="ghost" onClick={() => handleSkipTask(task._id)}>
                          Skip
                        </Button>
                        <Button variant="primary" onClick={() => handleCompleteTask(task._id)}>
                          Complete Task
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
