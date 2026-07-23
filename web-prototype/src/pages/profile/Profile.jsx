import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/api/auth.api'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/contexts/ToastContext'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const toast = useToast()

  const [form, setForm] = useState({ name: '', careerGoal: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        careerGoal: user.careerGoal || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const updatedUser = await updateProfile(form)
      updateUser(updatedUser)
      toast.success('Profile updated successfully')
    } catch (err) {
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Profile</h1>
        <p className={styles.subtitle}>Manage your personal information and career goals.</p>
      </div>

      <div className={styles.content}>
        <Card className={styles.profileCard}>
          <div className={styles.avatarSection}>
            <div className={styles.avatarLarge}>
              {user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <h2 className={styles.userName}>{user?.name}</h2>
              <p className={styles.userEmail}>{user?.email}</p>
              <div className={styles.badges}>
                <span className="badge badge-primary">{user?.role || 'user'}</span>
                <span className="badge badge-warning">⚡ {user?.xp || 0} XP</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className="section-title">Personal Information</div>
            
            <Input 
              id="name" name="name" 
              label="Full Name"
              value={form.name}
              onChange={handleChange}
              disabled={loading}
            />
            
            <Input 
              id="email" name="email" 
              label="Email Address"
              value={user?.email || ''}
              disabled={true}
              helper="Email cannot be changed."
            />
            
            <div className="section-title" style={{ marginTop: '1rem' }}>Career Goals</div>
            
            <Input 
              id="careerGoal" name="careerGoal" 
              label="Current Career Goal"
              placeholder="e.g. Become a Senior Frontend Developer"
              value={form.careerGoal}
              onChange={handleChange}
              disabled={loading}
            />
            
            <div className={styles.actions}>
              <Button type="submit" variant="primary" isLoading={loading}>
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
