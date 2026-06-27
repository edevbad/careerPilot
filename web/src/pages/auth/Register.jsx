import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { registerUser } from '@/api/auth.api'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function Register() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.id]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const res = await registerUser(form)
      login(res.data.token, res.data.user)
      navigate('/assessment')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Create your account</h2>
      <p className={styles.subtitle}>Start building your career roadmap today.</p>

      {serverError && <div className={styles.alert}>{serverError}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Full Name"
          id="name"
          placeholder="John Doe"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          required
        />
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          required
        />
        <Input
          label="Password"
          id="password"
          type="password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          required
        />
        <Button type="submit" loading={loading} fullWidth>
          Create Account
        </Button>
      </form>

      <p className={styles.switchLink}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  )
}