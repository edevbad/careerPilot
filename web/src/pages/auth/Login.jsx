import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [globalError, setGlobalError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    setGlobalError('')
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.email) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email address'
    if (!formData.password) newErrors.password = 'Password is required'
    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate()
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setGlobalError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${styles.container} fade-in`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Sign in to continue your career journey</p>
      </div>

      {globalError && <div className={styles.globalError}>{globalError}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading}
          />
          {errors.email && <span className={styles.errorText}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
            disabled={isLoading}
          />
          {errors.password && <span className={styles.errorText}>{errors.password}</span>}
        </div>

        <Button type="submit" isLoading={isLoading} className={`btn-primary ${styles.submitBtn}`}>
          Sign In
        </Button>
      </form>

      <p className={styles.footer}>
        Don't have an account? 
        <Link to="/register" className={styles.footerLink}>Create one</Link>
      </p>
    </div>
  )
}
