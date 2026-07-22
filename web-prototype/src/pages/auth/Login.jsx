import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/contexts/ToastContext'
import Input  from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()

  const [form, setForm]       = useState({ email: '', password: '' })
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
    if (!form.email)    e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.container} fade-up`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to continue your career journey</p>
      </div>

      {apiError && <div className={styles.apiError}>{apiError}</div>}

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
          placeholder="••••••••"
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

        <div className={styles.forgotRow}>
          <Link to="/forgot-password" className={styles.forgotLink}>Forgot password?</Link>
        </div>

        <Button type="submit" variant="primary" isLoading={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
          Sign In
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account?{' '}
        <Link to="/register" className={styles.footerLink}>Create one</Link>
      </p>
    </div>
  )
}
