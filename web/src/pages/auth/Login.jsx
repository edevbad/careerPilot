import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { loginUser } from '@/api/auth.api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginUser(form)
      console.log(res)
      login(res.data.accessToken, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Sign in to CareerPilot</h2>
      <p className={styles.subtitle}>Welcome back! Let's continue your journey.</p>

      {error && <div className={styles.alert}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          required
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={handleChange}
          required
        />
        <div className={styles.forgotRow}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" loading={loading} fullWidth>
          Sign In
        </Button>
      </form>

      <p className={styles.switchLink}>
        Don't have an account? <Link to="/register">Create one</Link>
      </p>
    </div>
  )
}