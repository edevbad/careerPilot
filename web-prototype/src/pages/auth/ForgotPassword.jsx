import { useState } from 'react'
import { Link } from 'react-router-dom'
import Input  from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail]       = useState('')
  const [emailError, setEmailError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email)          { setEmailError('Email is required'); return }
    if (!/\S+@\S+\.\S+/.test(email)) { setEmailError('Invalid email address'); return }
    // Note: The server endpoint for password reset is not yet implemented (see api.md Known Gaps)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className={`${styles.container} fade-up`}>
        <div className={styles.successBox}>
          <div className={styles.successIcon}>📬</div>
          <h2 className={styles.title}>Check your inbox</h2>
          <p className={styles.subtitle} style={{ textAlign: 'center' }}>
            If an account exists for <strong>{email}</strong>, you'll receive a password reset link shortly.
          </p>
          <Link to="/login" className={styles.footerLink} style={{ marginTop: '1rem', display: 'block', textAlign: 'center' }}>
            ← Back to Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} fade-up`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Reset password</h1>
        <p className={styles.subtitle}>Enter your email and we'll send you a link to reset your password.</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <Input
          id="email" name="email" type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setEmailError('') }}
          error={emailError}
          leftIcon="✉"
        />
        <Button type="submit" variant="primary" style={{ width: '100%', marginTop: '0.5rem' }}>
          Send Reset Link
        </Button>
      </form>

      <p className={styles.footer}>
        Remembered it?{' '}
        <Link to="/login" className={styles.footerLink}>Sign in</Link>
      </p>
    </div>
  )
}
