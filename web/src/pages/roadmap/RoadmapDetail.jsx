import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getRoadmapById, deleteRoadmap,
  updateSkillProgress, updateTaskProgress,
} from '@/api/roadmap.api'
import Card    from '@/components/ui/Card'
import Button  from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import styles  from './RoadmapDetail.module.css'

// ─── Helpers ───────────────────────────────────────────────────────────────────

const fmt = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const calcPercent = (items, key = 'completed') => {
  if (!items?.length) return 0
  return Math.round((items.filter((i) => i[key]).length / items.length) * 100)
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ percent, color = 'var(--color-primary)' }) {
  return (
    <div className={styles.progressTrack}>
      <div className={styles.progressFill}
        style={{ width: `${percent}%`, background: color }} />
    </div>
  )
}

function Timeline({ startDate, endDate }) {
  return (
    <div className={styles.timeline}>
      <span className={styles.timelineDate}>📅 {fmt(startDate)}</span>
      <span className={styles.timelineArrow}>→</span>
      <span className={styles.timelineDate}>🏁 {fmt(endDate)}</span>
    </div>
  )
}

function DailyTask({ task, onToggle }) {
  return (
    <div className={`${styles.task} ${task.completed ? styles.taskDone : ''}`}>
      <input type="checkbox" checked={task.completed} onChange={() => onToggle(!task.completed)}
        className={styles.taskCheck} />
      <div className={styles.taskBody}>
        <div className={styles.taskHeader}>
          <span className={styles.taskDay}>Day {task.day}</span>
          <span className={styles.taskTitle}>{task.title}</span>
        </div>
        {task.description && (
          <p className={styles.taskDesc}>{task.description}</p>
        )}
        {task.completed && task.completedAt && (
          <p className={styles.taskMeta}>✓ Completed {fmt(task.completedAt)}</p>
        )}
      </div>
    </div>
  )
}

function SkillCard({ skill, phaseIndex, skillIndex, onSkillToggle, onTaskToggle }) {
  const [expanded, setExpanded] = useState(false)
  const taskPercent = calcPercent(skill.dailyTasks)

  return (
    <div className={`${styles.skillCard} ${skill.completed ? styles.skillDone : ''}`}>
      {/* Skill Header */}
      <div className={styles.skillHeader}>
        <div className={styles.skillLeft}>
          <input type="checkbox" checked={skill.completed}
            onChange={() => onSkillToggle(phaseIndex, skillIndex, !skill.completed)}
            className={styles.skillCheck} />
          <div>
            <p className={styles.skillName}>{skill.name}</p>
            {skill.description && (
              <p className={styles.skillDesc}>{skill.description}</p>
            )}
          </div>
        </div>
        <div className={styles.skillRight}>
          <div className={styles.skillMeta}>
            <span className={styles.badge}>⏱ {skill.estimatedDays}d</span>
            <span className={styles.badge}>📅 {fmt(skill.startDate)}</span>
            <span className={styles.badge}>🏁 {fmt(skill.endDate)}</span>
          </div>
          <button className={styles.expandBtn} onClick={() => setExpanded((v) => !v)}>
            {expanded ? '▲ Hide tasks' : `▼ ${skill.dailyTasks?.length || 0} tasks`}
          </button>
        </div>
      </div>

      {/* Task Progress Bar */}
      <div className={styles.taskProgress}>
        <ProgressBar percent={taskPercent} />
        <span className={styles.taskProgressLabel}>{taskPercent}% tasks done</span>
      </div>

      {/* Daily Tasks */}
      {expanded && (
        <div className={styles.taskList}>
          {(skill.dailyTasks || []).map((task, tIdx) => (
            <DailyTask
              key={tIdx}
              task={task}
              onToggle={(completed) => onTaskToggle(phaseIndex, skillIndex, tIdx, completed)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function PhaseCard({ phase, phaseIndex, onSkillToggle, onTaskToggle }) {
  const [collapsed, setCollapsed] = useState(false)
  const skillPercent = calcPercent(phase.skills)

  return (
    <div className={styles.phaseCard}>
      {/* Phase Header */}
      <div className={styles.phaseHeader} onClick={() => setCollapsed((v) => !v)}>
        <div className={styles.phaseLeft}>
          <span className={styles.phaseOrder}>Phase {phase.order}</span>
          <div>
            <h3 className={styles.phaseTitle}>{phase.title}</h3>
            {phase.description && (
              <p className={styles.phaseDesc}>{phase.description}</p>
            )}
          </div>
        </div>
        <div className={styles.phaseRight}>
          <span className={styles.phasePercent}>{skillPercent}%</span>
          <span className={styles.collapseIcon}>{collapsed ? '▶' : '▼'}</span>
        </div>
      </div>

      {/* Phase Timeline */}
      <Timeline startDate={phase.startDate} endDate={phase.endDate} />

      {/* Phase Progress */}
      <ProgressBar percent={skillPercent} />

      {/* Skills */}
      {!collapsed && (
        <div className={styles.skillList}>
          {(phase.skills || []).map((skill, sIdx) => (
            <SkillCard
              key={sIdx}
              skill={skill}
              phaseIndex={phaseIndex}
              skillIndex={sIdx}
              onSkillToggle={onSkillToggle}
              onTaskToggle={onTaskToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function RoadmapDetail() {
  const { id }    = useParams()
  const navigate  = useNavigate()
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getRoadmapById(id)
      .then((res) => setRoadmap(res.data.data.roadmap))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('Delete this roadmap?')) return
    await deleteRoadmap(id)
    navigate('/roadmaps')
  }

  const handleSkillToggle = async (phaseIndex, skillIndex, completed) => {
    try {
      const res = await updateSkillProgress(id, phaseIndex, skillIndex, completed)
      setRoadmap(res.data.data.roadmap)
    } catch (err) {
      console.error('Failed to update skill:', err)
    }
  }

  const handleTaskToggle = async (phaseIndex, skillIndex, taskIndex, completed) => {
    try {
      const res = await updateTaskProgress(id, phaseIndex, skillIndex, taskIndex, completed)
      setRoadmap(res.data.data.roadmap)
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }

  if (loading) return <div className={styles.center}><Spinner /></div>
  if (!roadmap) return <p>Roadmap not found.</p>

  // Overall stats
  const allSkills = roadmap.phases?.flatMap((p) => p.skills) || []
  const allTasks  = allSkills.flatMap((s) => s.dailyTasks || [])
  const skillPct  = calcPercent(allSkills)
  const taskPct   = calcPercent(allTasks)

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>{roadmap.targetCareer}</h1>
          <p className={styles.sub}>{roadmap.summary}</p>
        </div>
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </div>

      {/* Overall Timeline */}
      <Card className={styles.overviewCard}>
        <div className={styles.overviewGrid}>
          <div className={styles.overviewStat}>
            <p className={styles.overviewLabel}>Start</p>
            <p className={styles.overviewValue}>{fmt(roadmap.startDate)}</p>
          </div>
          <div className={styles.overviewStat}>
            <p className={styles.overviewLabel}>End</p>
            <p className={styles.overviewValue}>{fmt(roadmap.endDate)}</p>
          </div>
          <div className={styles.overviewStat}>
            <p className={styles.overviewLabel}>Phases</p>
            <p className={styles.overviewValue}>{roadmap.phases?.length}</p>
          </div>
          <div className={styles.overviewStat}>
            <p className={styles.overviewLabel}>Skills</p>
            <p className={styles.overviewValue}>{allSkills.length}</p>
          </div>
          <div className={styles.overviewStat}>
            <p className={styles.overviewLabel}>Tasks</p>
            <p className={styles.overviewValue}>{allTasks.length}</p>
          </div>
        </div>

        <div className={styles.overviewProgress}>
          <div className={styles.progressRow}>
            <span>Skills</span>
            <ProgressBar percent={skillPct} />
            <span className={styles.pct}>{skillPct}%</span>
          </div>
          <div className={styles.progressRow}>
            <span>Tasks</span>
            <ProgressBar percent={taskPct} color="var(--color-success)" />
            <span className={styles.pct}>{taskPct}%</span>
          </div>
        </div>
      </Card>

      {/* Phases */}
      <div className={styles.phases}>
        {roadmap.phases?.map((phase, pIdx) => (
          <PhaseCard
            key={pIdx}
            phase={phase}
            phaseIndex={pIdx}
            onSkillToggle={handleSkillToggle}
            onTaskToggle={handleTaskToggle}
          />
        ))}
      </div>

    </div>
  )
}