import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import Input  from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const toast = useToast()

  const [form, setForm]       = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors]   = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((p) => ({ ...p, [name]: value }))
    setErrors((p) => ({ ...p, [name]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())     e.name = 'Name is required'
    if (!form.email)           e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.password)        e.password = 'Password is required'
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await register(form.name.trim(), form.email, form.password, form.confirmPassword)
      toast.success('Account created! Welcome to CareerPilot 🎉')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.container} fade-up`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Create account</h1>
        <p className={styles.subtitle}>Start your AI-powered career journey today</p>
      </div>

      {apiError && <div className={styles.apiError}>{apiError}</div>}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          id="name" name="name" type="text"
          label="Full name"
          placeholder="Alice Johnson"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          disabled={loading}
          leftIcon="👤"
        />
        <Input
          id="email" name="email" type="email"
          label="Email address"
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
          disabled={loading}
          leftIcon="✉"
        />
        <Input
          id="password" name="password"
          type={showPass ? 'text' : 'password'}
          label="Password"
          placeholder="Min. 8 characters"
          value={form.password}
          onChange={handleChange}
          error={errors.password}
          disabled={loading}
          leftIcon="🔒"
          rightElement={
            <button type="button" className={styles.showPassBtn} onClick={() => setShowPass(!showPass)}>
              {showPass ? '🙈' : '👁'}
            </button>
          }
        />
        <Input
          id="confirmPassword" name="confirmPassword"
          type={showPass ? 'text' : 'password'}
          label="Confirm password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          disabled={loading}
          leftIcon="🔒"
        />

        <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          Create Account
        </Button>
      </form>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to="/login" className={styles.footerLink}>Sign in</Link>
      </p>
    </div>
  )
}
