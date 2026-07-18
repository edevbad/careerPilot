import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getTodayTasks, completeTask, skipTask } from '@/api/tasks.api'
import { getRoadmaps } from '@/api/roadmap.api'
import { getProgressSummary } from '@/api/progress.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const { user } = useAuth()

  const [tasks, setTasks] = useState([])
  const [taskSummary, setTaskSummary] = useState({ total: 0, completed: 0, xpEarned: 0 })
  const [roadmap, setRoadmap] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [taskData, roadmapsRes, progressSummary] = await Promise.all([
        getTodayTasks(),
        getRoadmaps(),
        getProgressSummary().catch(() => null), // non-fatal
      ])

      setTasks(taskData.tasks || [])
      setTaskSummary(taskData.summary || { total: 0, completed: 0, xpEarned: 0 })

      const roadmaps = roadmapsRes.data?.data?.roadmaps || []
      const active = roadmaps.find((r) => r.status === 'active') || roadmaps[0] || null
      setRoadmap(active)

      setSummary(progressSummary)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load your dashboard.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleComplete = async (taskId) => {
    // Optimistic update — checkbox flips immediately, XP toast-style bump
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'completed' } : t)))
    try {
      const result = await completeTask(taskId)
      setTaskSummary((prev) => ({
        ...prev,
        completed: prev.completed + 1,
        xpEarned: prev.xpEarned + (result.xpEarned || 0),
      }))
    } catch {
      // revert on failure
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'pending' } : t)))
    }
  }

  const handleSkip = async (taskId) => {
    setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'skipped' } : t)))
    try {
      await skipTask(taskId, 'other')
    } catch {
      setTasks((prev) => prev.map((t) => (t._id === taskId ? { ...t, status: 'pending' } : t)))
    }
  }

  if (loading) {
    return <div className={styles.center}><Spinner /></div>
  }

  const pendingTasks = tasks.filter((t) => t.status === 'pending')
  const activePhase = roadmap?.phases?.find((p) => p.phaseNumber === roadmap.activePhaseNumber)
  const totalPhases = roadmap?.phases?.length || 0
  const completedPhases = roadmap?.phases?.filter((p) => p.status === 'completed').length || 0

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className={styles.sub}>Here's your focus for today.</p>
        </div>
        {taskSummary.total > 0 && (
          <div className={styles.xpPill}>
            <span className={styles.xpBolt}>⚡</span>
            +{taskSummary.xpEarned} XP today
          </div>
        )}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.layout}>
        {/* ── Left column: Today's Focus ─────────────────────── */}
        <div className={styles.mainCol}>
          <Card className={styles.tasksCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Today's Tasks</h2>
              <span className={styles.taskCount}>
                {taskSummary.completed} of {taskSummary.total} done
              </span>
            </div>

            {taskSummary.total > 0 && (
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(taskSummary.completed / taskSummary.total) * 100}%` }}
                />
              </div>
            )}

            {tasks.length === 0 ? (
              <p className={styles.emptyTasks}>
                No tasks generated yet. Visit your{' '}
                <Link to="/roadmaps">roadmap</Link> to get started.
              </p>
            ) : pendingTasks.length === 0 ? (
              <p className={styles.emptyTasks}>🎉 All caught up for today. Nice work.</p>
            ) : (
              <ul className={styles.taskList}>
                {pendingTasks.map((task) => (
                  <li key={task._id} className={styles.taskRow}>
                    <label className={styles.taskCheckLabel}>
                      <input
                        type="checkbox"
                        className={styles.taskCheckbox}
                        onChange={() => handleComplete(task._id)}
                      />
                      <span className={styles.taskTypeBadge} data-type={task.taskType}>
                        {taskTypeIcon(task.taskType)}
                      </span>
                      <span className={styles.taskInfo}>
                        <span className={styles.taskTitle}>{task.title}</span>
                        <span className={styles.taskMeta}>
                          ~{task.estimatedMinutes} min · +{task.xpReward} XP
                        </span>
                      </span>
                    </label>
                    <button
                      className={styles.skipBtn}
                      onClick={() => handleSkip(task._id)}
                      aria-label="Skip task"
                    >
                      Skip
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {/* ── Right column: Motivation & Analytics ───────────── */}
        <div className={styles.sideCol}>
          <Card className={styles.streakCard}>
            <div className={styles.streakTop}>
              <span className={styles.flame}>🔥</span>
              <div>
                <p className={styles.streakValue}>{user?.currentStreak ?? 0}</p>
                <p className={styles.streakLabel}>day streak</p>
              </div>
            </div>
            <div className={styles.xpBarWrap}>
              <div className={styles.xpBarHeader}>
                <span>Level {levelFromXp(user?.xpTotal)}</span>
                <span>{user?.xpTotal ?? 0} XP</span>
              </div>
              <div className={styles.progressTrack}>
                <div
                  className={styles.xpBarFill}
                  style={{ width: `${xpProgressPercent(user?.xpTotal)}%` }}
                />
              </div>
            </div>
          </Card>

          <Card className={styles.roadmapWidget}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Current Roadmap</h2>
            </div>
            {!roadmap ? (
              <div className={styles.emptyRoadmap}>
                <p>You haven't started a roadmap yet.</p>
                <Link to="/assessment"><Button>Generate one</Button></Link>
              </div>
            ) : (
              <>
                <p className={styles.roadmapCareer}>{roadmap.targetCareer}</p>
                <p className={styles.roadmapPhase}>
                  {activePhase ? activePhase.title : 'All phases complete'}
                </p>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${totalPhases ? (completedPhases / totalPhases) * 100 : 0}%` }}
                  />
                </div>
                <p className={styles.roadmapStepCount}>
                  {completedPhases} / {totalPhases} phases complete
                </p>
                <Link to={`/roadmaps/${roadmap._id}`} className={styles.roadmapLink}>
                  <Button variant="secondary" fullWidth>View Roadmap →</Button>
                </Link>
              </>
            )}
          </Card>

          {summary && (
            <Card className={styles.statsCard}>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Overall Progress</span>
                <span className={styles.statValue}>{summary.overallPercentage}%</span>
              </div>
              <div className={styles.statRow}>
                <span className={styles.statLabel}>Skills Completed</span>
                <span className={styles.statValue}>{summary.completedSkills}</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function taskTypeIcon(type) {
  switch (type) {
    case 'video': return '🎬'
    case 'coding': return '💻'
    case 'mini-project': return '🛠️'
    default: return '📖'
  }
}

// Simple, deterministic level curve: level N requires N*250 XP
function levelFromXp(xp = 0) {
  return Math.max(1, Math.floor(xp / 250) + 1)
}

function xpProgressPercent(xp = 0) {
  const remainder = xp % 250
  return Math.round((remainder / 250) * 100)
}