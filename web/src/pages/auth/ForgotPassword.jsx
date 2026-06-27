import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    // TODO: wire up to POST /auth/forgot-password
    await new Promise((r) => setTimeout(r, 1000))
    setLoading(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.successBox}>
          <span>✅</span>
          <h2>Check your email</h2>
          <p>We've sent a password reset link to <strong>{email}</strong>.</p>
          <Link to="/login">Back to Sign In</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>Reset your password</h2>
      <p className={styles.subtitle}>Enter your email and we'll send you a reset link.</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} fullWidth>
          Send Reset Link
        </Button>
      </form>

      <p className={styles.switchLink}>
        <Link to="/login">← Back to Sign In</Link>
      </p>
    </div>
  )
}