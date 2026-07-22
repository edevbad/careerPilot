import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getRoadmapById, updateSkillProgress, updateTaskProgress } from '@/api/roadmap.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/contexts/ToastContext'
import styles from './Roadmap.module.css'

export default function RoadmapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandedPhase, setExpandedPhase] = useState(0) // index of expanded phase

  console.log(roadmap);
  

  useEffect(() => {
    fetchRoadmap()
  }, [id])

  const fetchRoadmap = async () => {
    try {
      const data = await getRoadmapById(id)
      setRoadmap(data)
    } catch (err) {
      toast.error('Failed to load roadmap')
      navigate('/roadmaps')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleSkill = async (phaseIdx, skillIdx, currentStatus) => {
    try {
      // Optimistic update
      const updated = { ...roadmap }
      updated.phases[phaseIdx].skills[skillIdx].completed = !currentStatus
      setRoadmap(updated)
      
      await updateSkillProgress(roadmap._id, phaseIdx, skillIdx, !currentStatus)
    } catch (err) {
      toast.error('Failed to update skill progress')
      fetchRoadmap() // revert
    }
  }
  
  const handleToggleTask = async (phaseIdx, skillIdx, taskIdx, currentStatus) => {
    try {
      const updated = { ...roadmap }
      updated.phases[phaseIdx].skills[skillIdx].dailyTasks[taskIdx].completed = !currentStatus
      setRoadmap(updated)
      
      await updateTaskProgress(roadmap._id, phaseIdx, skillIdx, taskIdx, !currentStatus)
    } catch (err) {
      toast.error('Failed to update task progress')
      fetchRoadmap()
    }
  }

  if (loading || !roadmap) {
    return (
      <div className={styles.loadingState}>
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      {/* Header Info */}
      <div className={styles.detailHeader}>
        <div className={styles.detailTitleRow}>
          <Link to="/roadmaps" className={styles.backBtn}>← Back</Link>
          <div className={styles.tags}>
            <span className="badge badge-primary">{roadmap.skillLevel}</span>
            <span className="badge badge-muted">{roadmap.duration}</span>
          </div>
        </div>
        <h1 className={styles.title}>{roadmap.targetCareer}</h1>
        <p className={styles.subtitle}>{roadmap.summary}</p>
      </div>

      {/* Phases */}
      <div className={styles.phasesList}>
        {roadmap.phases?.map((phase, pIdx) => {
          const isExpanded = expandedPhase === pIdx
          
          return (
            <Card key={pIdx} className={styles.phaseCard}>
              <div 
                className={styles.phaseHeader} 
                onClick={() => setExpandedPhase(isExpanded ? -1 : pIdx)}
              >
                <div className={styles.phaseTitleGroup}>
                  <div className={styles.phaseNumber}>{pIdx + 1}</div>
                  <div>
                    <h3 className={styles.phaseTitle}>{phase.title}</h3>
                    <p className={styles.phaseDesc}>{phase.description}</p>
                  </div>
                </div>
                <div className={styles.phaseActions}>
                  <Link 
                    to={`/quiz/${roadmap._id}/phase/${phase.phaseNumber}`} 
                    className="btn-secondary" 
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    Take Quiz
                  </Link>
                  <span className={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className={styles.phaseContent}>
                  {phase.subTopics?.map((skill, sIdx) => (
                    <div key={sIdx} className={styles.skillGroup}>
                      <div className={styles.skillHeader}>
                        <label className={styles.checkboxLabel}>
                          <input 
                            type="checkbox" 
                            checked={skill.completed || false}
                            onChange={() => handleToggleSkill(pIdx, sIdx, skill.completed)}
                            className={styles.checkbox}
                          />
                          <span className={styles.skillName}>{skill.title}</span>
                        </label>
                      </div>
                      
                      <div className={styles.tasksList}>
                        {skill.dailyTasks?.map((task, tIdx) => (
                          <div key={tIdx} className={styles.taskItem}>
                            <label className={styles.checkboxLabel}>
                              <input 
                                type="checkbox" 
                                checked={task.completed || false}
                                onChange={() => handleToggleTask(pIdx, sIdx, tIdx, task.completed)}
                                className={styles.checkbox}
                              />
                              <div className={styles.taskContent}>
                                <span className={styles.taskTitle}>{task.title}</span>
                                {task.resourceUrl && (
                                  <a href={task.resourceUrl} target="_blank" rel="noreferrer" className={styles.taskResLink}>
                                    [Resource]
                                  </a>
                                )}
                              </div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
