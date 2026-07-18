import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom'
import { getQuizResults } from '@/api/quizzes.api'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import styles from './QuizResults.module.css'

export default function QuizResults() {
  const { roadmapId, phaseNumber } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [result, setResult] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [error, setError] = useState('')

  useEffect(() => {
    if (result) return
    // Refresh fallback — pull the most recent attempt instead of the raw
    // submit payload (which only exists in navigation state).
    getQuizResults(roadmapId, phaseNumber)
      .then((data) => {
        const latest = data.attempts?.at(-1)
        if (!latest) {
          setError('No quiz attempt found for this phase.')
          return
        }
        setResult({
          passed: latest.passed,
          score: latest.score,
          correctAnswers: latest.correctAnswers,
          totalQuestions: latest.totalQuestions,
          passingScore: data.passingScore,
          studySuggestions: latest.studySuggestions || [],
          durationFormatted: latest.durationFormatted,
        })
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load quiz results.'))
      .finally(() => setLoading(false))
  }, [result, roadmapId, phaseNumber])

  if (loading) return <div className={styles.center}><Spinner /></div>

  if (error || !result) {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>{error || 'No result to show.'}</p>
        <Link to={`/roadmaps/${roadmapId}`}><Button>Back to Roadmap</Button></Link>
      </div>
    )
  }

  const { passed, score, correctAnswers, totalQuestions, passingScore, studySuggestions, durationFormatted } = result

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={`${styles.ring} ${passed ? styles.ringPass : styles.ringFail}`}>
          <span className={styles.ringScore}>{score}%</span>
        </div>

        <h1 className={styles.title}>
          {passed ? '🎉 Phase Passed!' : 'Keep Practicing'}
        </h1>
        <p className={styles.subtitle}>
          {passed
            ? `You scored ${score}% and unlocked the next phase.`
            : `You scored ${score}%. You need ${passingScore}% to pass.`}
        </p>

        <div className={styles.statsRow}>
          <Stat label="Correct" value={correctAnswers} color="var(--color-success)" />
          <Stat label="Total" value={totalQuestions} color="var(--color-text)" />
          {durationFormatted && <Stat label="Time" value={durationFormatted} color="var(--color-primary)" />}
        </div>

        {!passed && studySuggestions?.length > 0 && (
          <div className={styles.suggestions}>
            <h2 className={styles.suggestTitle}>Study Suggestions</h2>
            <ul className={styles.suggestList}>
              {studySuggestions.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        {!passed && (
          <p className={styles.cooldownNote}>
            You can retake this quiz in 24 hours.
          </p>
        )}

        <div className={styles.actions}>
          <Button onClick={() => navigate(`/roadmaps/${roadmapId}`)} fullWidth>
            {passed ? 'Continue to Next Phase' : 'Back to Roadmap'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className={styles.stat}>
      <p className={styles.statValue} style={{ color }}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  )
}