import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoadmap } from '@/api/roadmap.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import styles from './CareerAssessment.module.css'

const CAREER_OPTIONS = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'DevOps Engineer',
  'UI/UX Designer',
  'Mobile Developer',
]

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const DURATIONS = ['1 month', '3 months', '6 months', '1 year']

export default function CareerAssessment() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    targetCareer: '',
    skillLevel: '',
    interests: '',
    duration: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await generateRoadmap(form)
      console.log(res)
      navigate(`/roadmaps/${res.data.data.roadmap._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate roadmap.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Career Assessment</h1>
      <p className={styles.sub}>Tell us about yourself and we'll generate your personalized roadmap.</p>

      <Card>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Target Career *</label>
            <select
              className={styles.select}
              value={form.targetCareer}
              onChange={(e) => handleChange('targetCareer', e.target.value)}
              required
            >
              <option value="">Select a career path</option>
              {CAREER_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Current Skill Level *</label>
            <div className={styles.optionGroup}>
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`${styles.optionBtn} ${form.skillLevel === level ? styles.selected : ''}`}
                  onClick={() => handleChange('skillLevel', level)}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Learning Duration *</label>
            <div className={styles.optionGroup}>
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`${styles.optionBtn} ${form.duration === d ? styles.selected : ''}`}
                  onClick={() => handleChange('duration', d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Interests / Notes</label>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="e.g. I enjoy building APIs, I have some experience with JavaScript..."
              value={form.interests}
              onChange={(e) => handleChange('interests', e.target.value)}
            />
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <Button type="submit" loading={loading} fullWidth>
            Generate My Roadmap
          </Button>
        </form>
      </Card>
    </div>
  )
}