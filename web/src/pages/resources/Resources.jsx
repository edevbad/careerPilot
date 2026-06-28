import { useEffect, useState } from 'react'
import { getSkills, getResources } from '@/api/resources.api'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import styles from './Resources.module.css'

export default function Resources() {
  const [skills, setSkills] = useState([])
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getSkills().then((res) => setSkills(res.data.skills || [])).catch(console.error)
  }, [])

  const handleSkillSelect = async (skill) => {
    setSelectedSkill(skill)
    setLoading(true)
    try {
      const res = await getResources(skill.id)
      setResources(res.data.resources || [])
    } catch {
      setResources([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Learning Resources</h1>
      <p className={styles.sub}>Browse curated courses, docs, and tutorials by skill.</p>

      <div className={styles.layout}>
        <aside className={styles.skillPanel}>
          <p className={styles.panelTitle}>Skills</p>
          {skills.length === 0 ? (
            <p className={styles.empty}>No skills available.</p>
          ) : (
            skills.map((skill) => (
              <button
                key={skill.id}
                className={`${styles.skillBtn} ${selectedSkill?.id === skill.id ? styles.activeSkill : ''}`}
                onClick={() => handleSkillSelect(skill)}
              >
                {skill.name}
              </button>
            ))
          )}
        </aside>

        <div className={styles.resourcePanel}>
          {!selectedSkill ? (
            <Card><p className={styles.empty}>Select a skill to see resources.</p></Card>
          ) : loading ? (
            <div className={styles.center}><Spinner /></div>
          ) : resources.length === 0 ? (
            <Card><p className={styles.empty}>No resources found for this skill.</p></Card>
          ) : (
            <div className={styles.grid}>
              {resources.map((r) => (
                <Card key={r.id}>
                  <h3 className={styles.resourceTitle}>{r.title}</h3>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                    Open Resource →
                  </a>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}