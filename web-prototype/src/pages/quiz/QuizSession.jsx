import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuizQuestions, submitQuiz } from '@/api/quizzes.api'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import ProgressBar from '@/components/ui/ProgressBar'
import { useToast } from '@/contexts/ToastContext'
import styles from './Quiz.module.css'

export default function QuizSession() {
  const { roadmapId, phaseNumber } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [answers, setAnswers] = useState({}) // { questionId: "A" }
  const [result, setResult] = useState(null) // the result payload after submit

  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      const data = await getQuizQuestions(roadmapId, phaseNumber)
      setSession(data)
    } catch (err) {
      toast.error('Failed to start quiz')
      navigate(`/quiz/${roadmapId}/phase/${phaseNumber}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = async () => {
    const qCount = session.questions.length
    if (Object.keys(answers).length < qCount) {
      if (!window.confirm('You have unanswered questions. Submit anyway?')) return
    }

    setSubmitting(true)
    try {
      // Build answers array per API spec
      const answersArr = session.questions.map(q => ({
        questionId: q.id,
        userAnswer: answers[q.id] || null,
        questionType: q.questionType,
        questionText: q.questionText,
        _correctAnswer: 'Dummy', // API requires this, but we obviously shouldn't send real correct answers from client in prod. For prototype, we mock.
        _explanation: 'Dummy',
        _topic: 'Dummy'
      }))

      const payload = {
        startedAt: session.startedAt,
        answers: answersArr
      }

      const res = await submitQuiz(roadmapId, phaseNumber, payload)
      setResult(res)
      toast.success('Quiz submitted!')
    } catch (err) {
      toast.error('Failed to submit quiz')
      setSubmitting(false)
    }
  }

  if (loading) return <div className={styles.loadingState}><Spinner size={40} /></div>

  // Result Screen
  if (result) {
    return (
      <div className={`fade-in ${styles.container} ${styles.resultContainer}`}>
        <Card className={styles.resultCard} glow>
          <div className={styles.resultIcon}>{result.passed ? '🎉' : '💔'}</div>
          <h2>{result.passed ? 'Congratulations!' : 'Not quite there yet.'}</h2>
          
          <div className={styles.scoreCircle}>
            <span className={result.passed ? styles.textSuccess : styles.textError}>{result.score}%</span>
          </div>
          <p className={styles.scoreText}>
            You answered {result.correctAnswers} out of {result.totalQuestions} correctly.<br/>
            Passing score is {result.passingScore}%.
          </p>

          {result.studySuggestions?.length > 0 && (
             <div className={styles.suggestionsList}>
               <h4>Study Suggestions:</h4>
               <ul>
                 {result.studySuggestions.map((s, i) => <li key={i}>{s}</li>)}
               </ul>
             </div>
          )}

          <div className={styles.resultActions}>
            <Button variant="ghost" onClick={() => navigate(`/roadmaps/${roadmapId}`)}>
              Back to Roadmap
            </Button>
            {result.nextPhaseUnlocked && (
               <Button variant="primary" onClick={() => navigate(`/roadmaps/${roadmapId}`)}>
                 View Next Phase ✨
               </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  // Quiz Session Screen
  const q = session?.questions[currentIdx]
  const pct = ((currentIdx) / (session?.totalQuestions || 1)) * 100

  return (
    <div className={`fade-in ${styles.container} ${styles.sessionContainer}`}>
      <div className={styles.sessionHeader}>
        <div>
          <h2 className={styles.sessionTitle}>{session?.phaseTitle}</h2>
          <p className={styles.sessionCount}>Question {currentIdx + 1} of {session?.totalQuestions}</p>
        </div>
        <Button variant="ghost" onClick={() => navigate(`/quiz/${roadmapId}/phase/${phaseNumber}`)}>
          Exit
        </Button>
      </div>

      <ProgressBar value={pct} height={4} color="var(--color-primary)" />

      <Card className={styles.questionCard}>
        <h3 className={styles.questionText}>{q?.questionText}</h3>
        
        <div className={styles.optionsList}>
          {q?.options.map((opt, i) => (
            <button 
              key={i} 
              className={`${styles.optionBtn} ${answers[q.id] === opt ? styles.optionSelected : ''}`}
              onClick={() => handleSelectOption(q.id, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      </Card>

      <div className={styles.sessionFooter}>
        <Button 
          variant="secondary" 
          disabled={currentIdx === 0} 
          onClick={() => setCurrentIdx(p => p - 1)}
        >
          Previous
        </Button>
        
        {currentIdx === (session?.totalQuestions - 1) ? (
          <Button variant="primary" onClick={handleSubmit} isLoading={submitting}>
            Submit Quiz
          </Button>
        ) : (
          <Button variant="primary" onClick={() => setCurrentIdx(p => p + 1)}>
            Next Question
          </Button>
        )}
      </div>
    </div>
  )
}
