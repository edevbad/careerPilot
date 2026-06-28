import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile } from '@/api/auth.api'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Profile.module.css'

export default function Profile() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    careerGoal: user?.careerGoal || '',
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      await updateProfile(form)
      setSuccess(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Profile</h1>
      <p className={styles.sub}>Manage your account information and career preferences.</p>

      <Card className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Full Name"
            id="name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email"
            id="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Career Goal"
            id="careerGoal"
            placeholder="e.g. Backend Developer"
            value={form.careerGoal}
            onChange={handleChange}
          />
          {success && <p className={styles.success}>Profile updated successfully.</p>}
          <Button type="submit" loading={saving}>Save Changes</Button>
        </form>
      </Card>
    </div>
  )
}