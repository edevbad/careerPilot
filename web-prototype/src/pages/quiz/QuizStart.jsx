import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getQuizRetakeStatus, getQuizResults } from '@/api/quizzes.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { useToast } from '@/contexts/ToastContext'
import styles from './Quiz.module.css'

export default function QuizStart() {
  const { roadmapId, phaseNumber } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [status, setStatus] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [roadmapId, phaseNumber])

  const fetchData = async () => {
    try {
      const [statusData, resultsData] = await Promise.all([
        getQuizRetakeStatus(roadmapId, phaseNumber),
        getQuizResults(roadmapId, phaseNumber)
      ])
      setStatus(statusData)
      setResults(resultsData)
    } catch (err) {
      toast.error('Failed to load quiz status')
    } finally {
      setLoading(false)
    }
  }

  const handleStart = () => {
    navigate(`/quiz/${roadmapId}/phase/${phaseNumber}/session`)
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <Spinner size={40} />
      </div>
    )
  }

  return (
    <div className={`fade-in ${styles.container}`}>
      <Link to={`/roadmaps/${roadmapId}`} className={styles.backBtn}>← Back to Roadmap</Link>
      
      <div className={styles.header}>
        <h1 className={styles.title}>Phase {phaseNumber} Quiz</h1>
        <p className={styles.subtitle}>Test your knowledge to unlock the next phase.</p>
      </div>

      <div className={styles.grid}>
        <Card className={styles.mainCard} glow>
          {status?.canTake ? (
            <div className={styles.readyBox}>
              <div className={styles.readyIcon}>🚀</div>
              <h2>Ready when you are!</h2>
              <p>This quiz contains multiple-choice questions. You need {results?.passingScore}% to pass.</p>
              <Button variant="primary" onClick={handleStart} style={{ marginTop: '1.5rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>
                Start Quiz Now
              </Button>
            </div>
          ) : (
            <div className={styles.cooldownBox}>
              <div className={styles.cooldownIcon}>⏳</div>
              <h2>Cooldown Active</h2>
              <p>{status?.message || 'You must wait before retaking this quiz.'}</p>
              
              {status?.studySuggestions && status.studySuggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <h4>What to study in the meantime:</h4>
                  <ul>
                    {status.studySuggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className={styles.historyCard}>
          <h3>Attempt History</h3>
          {results?.totalAttempts > 0 ? (
            <div className={styles.historyList}>
              <div className={styles.historyStat}>
                <span className={styles.hLabel}>Best Score:</span>
                <span className={styles.hVal}>{results.bestScore}%</span>
              </div>
              <div className={styles.historyStat}>
                <span className={styles.hLabel}>Status:</span>
                <span className={results.hasPassed ? styles.textSuccess : styles.textError}>
                  {results.hasPassed ? 'Passed ✓' : 'Not passed yet'}
                </span>
              </div>
              
              <div className={styles.attemptList}>
                {results.attempts.map(a => (
                  <div key={a._id} className={styles.attemptItem}>
                    <span>Attempt #{a.attemptNumber}</span>
                    <span className={a.passed ? styles.textSuccess : styles.textError}>
                      {a.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className={styles.emptyText}>You haven't attempted this quiz yet.</p>
          )}
        </Card>
      </div>
    </div>
  )
}
