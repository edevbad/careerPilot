import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateRoadmap } from '@/api/roadmap.api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import styles from './Roadmap.module.css'

export default function GenerateRoadmap() {
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({
    targetCareer: '',
    skillLevel: 'Beginner',
    duration: '3 months',
    interests: '',
    startDate: new Date().toISOString().split('T')[0]
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
    setErrors(p => ({ ...p, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Basic validation
    const e_ = {}
    if (!form.targetCareer) e_.targetCareer = 'Target career is required'
    if (Object.keys(e_).length) { setErrors(e_); return }

    setLoading(true)
    try {
      const roadmap = await generateRoadmap(form)
      toast.success('Roadmap generated successfully!')
      navigate(`/roadmaps/${roadmap._id}`)
    } catch (err) {
      toast.error('Failed to generate roadmap. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fade-up ${styles.generateContainer}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Generate Roadmap</h1>
        <p className={styles.subtitle}>Tell our AI what you want to learn, and we'll build a custom path for you.</p>
      </div>

      <div className={styles.generateCard}>
        <form onSubmit={handleSubmit} className={styles.generateForm}>
          
          <Input 
            id="targetCareer" name="targetCareer"
            label="Target Career or Goal"
            placeholder="e.g. Full Stack Developer, Data Scientist"
            value={form.targetCareer}
            onChange={handleChange}
            error={errors.targetCareer}
            disabled={loading}
          />
          
          <div className={styles.formRow}>
            <div className={styles.selectGroup}>
              <label className={styles.label}>Skill Level</label>
              <select name="skillLevel" value={form.skillLevel} onChange={handleChange} disabled={loading} className={styles.select}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
            
            <div className={styles.selectGroup}>
              <label className={styles.label}>Duration</label>
              <select name="duration" value={form.duration} onChange={handleChange} disabled={loading} className={styles.select}>
                <option value="1 month">1 Month</option>
                <option value="3 months">3 Months</option>
                <option value="6 months">6 Months</option>
                <option value="1 year">1 Year</option>
              </select>
            </div>
          </div>
          
          <Input 
            id="interests" name="interests"
            label="Specific Interests / Technologies (Optional)"
            placeholder="e.g. React, Python, Cloud computing"
            value={form.interests}
            onChange={handleChange}
            disabled={loading}
          />
          
          <Input 
            id="startDate" name="startDate" type="date"
            label="Start Date"
            value={form.startDate}
            onChange={handleChange}
            disabled={loading}
          />
          
          <div className={styles.generateActions}>
            <Button type="button" variant="ghost" onClick={() => navigate('/roadmaps')} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={loading}>
              ✨ Generate with AI
            </Button>
          </div>
          
        </form>
        
        {/* Decorative side panel */}
        <div className={styles.generateSide}>
           <div className={styles.aiGlow}></div>
           <h3>AI Powered</h3>
           <p>Our intelligent system creates a structured, day-by-day learning plan tailored exactly to your current skill level and goals.</p>
           
           <ul className={styles.featureList}>
             <li>✓ Customized learning phases</li>
             <li>✓ Daily actionable tasks</li>
             <li>✓ Interleaved quizzes</li>
             <li>✓ Curated resource links</li>
           </ul>
        </div>
      </div>
    </div>
  )
}
