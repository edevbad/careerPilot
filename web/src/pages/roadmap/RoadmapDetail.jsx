import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRoadmapById, deleteRoadmap, updateProgress } from '@/api/roadmap.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import styles from './Roadmap.module.css'

export default function RoadmapDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
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

  const handleToggleSkill = async (phaseIdx, skillIdx, current) => {
    const skillId = `${phaseIdx}-${skillIdx}`
    await updateProgress(id, skillId, !current)
    setRoadmap((prev) => {
      const updated = { ...prev }
      updated.phases[phaseIdx].skills[skillIdx].completed = !current
      return updated
    })
  }

  if (loading) return <div className={styles.center}><Spinner /></div>
  if (!roadmap) return <p>Roadmap not found.</p>

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>{roadmap.targetCareer}</h1>
          <p className={styles.sub}>{roadmap.phases?.length} phases in your roadmap</p>
        </div>
        <Button variant="danger" onClick={handleDelete}>Delete</Button>
      </div>

      <div className={styles.phases}>
        {roadmap.phases?.map((phase, pIdx) => (
          <Card key={pIdx} className={styles.phaseCard}>
            <h3 className={styles.phaseTitle}>Phase {pIdx + 1}: {phase.title}</h3>
            <ul className={styles.skillList}>
              {phase.skills?.map((skill, sIdx) => (
                <li key={sIdx} className={styles.skillItem}>
                  <input
                    type="checkbox"
                    checked={!!skill.completed}
                    onChange={() => handleToggleSkill(pIdx, sIdx, skill.completed)}
                    id={`skill-${pIdx}-${sIdx}`}
                  />
                  <label htmlFor={`skill-${pIdx}-${sIdx}`}>{skill.name}</label>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}