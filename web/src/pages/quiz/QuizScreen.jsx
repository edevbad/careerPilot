import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getQuizQuestions, submitQuiz } from '@/api/quizzes.api'
import Spinner from '@/components/ui/Spinner'
import styles from './QuizScreen.module.css'

// Normalizes question shape — the API can return either DB-bank questions
// (question_text, question_type, snake_case) or AI-generated ones
// (questionText, questionType, camelCase). See callout in PR notes.
function normalizeQuestion(q) {
  return {
    id: q.id,
    text: q.questionText ?? q.question_text ?? '',
    type: q.questionType ?? q.question_type ?? 'mcq',
    options: q.options || {},
    codeSnippet: q.codeSnippet ?? q.code_snippet ?? null,
    raw: q,
  }
}

function formatElapsed(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function QuizScreen() {
  const { roadmapId, phaseNumber } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [quizMeta, setQuizMeta] = useState(null)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({}) // questionId -> selected key
  const [elapsed, setElapsed] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [confirmSkip, setConfirmSkip] = useState(false)
  const startedAtRef = useRef(null)

  useEffect(() => {
    let mounted = true
    getQuizQuestions(roadmapId, phaseNumber)
      .then((data) => {
        if (!mounted) return
        setQuizMeta(data)
        setQuestions((data.questions || []).map(normalizeQuestion))
        startedAtRef.current = data.startedAt || new Date().toISOString()
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load this quiz.')
      })
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [roadmapId, phaseNumber])

  useEffect(() => {
    if (loading) return
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(timer)
  }, [loading])

  const answeredCount = Object.keys(answers).length
  const current = questions[currentIndex]

  const selectAnswer = useCallback((questionId, key) => {
    setAnswers((prev) => ({ ...prev, [questionId]: key }))
  }, [])

  const goTo = (i) => {
    if (i < 0 || i >= questions.length) return
    setCurrentIndex(i)
  }

  const buildPayload = () =>
    questions.map((q) => ({
      questionId: q.id,
      userAnswer: answers[q.id] ?? null,
      questionType: q.type,
      questionText: q.text,
      // Passed through for AI-generated questions per the backend's grading
      // contract — currently unpopulated by the API (see PR notes).
      _correctAnswer: q.raw.correctAnswer,
      _explanation: q.raw.explanation,
      _topic: q.raw.topic,
    }))

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const result = await submitQuiz(roadmapId, phaseNumber, {
        answers: buildPayload(),
        startedAt: startedAtRef.current,
      })
      navigate(`/roadmaps/${roadmapId}/quiz/${phaseNumber}/results`, {
        state: { result },
        replace: true,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz. Please try again.')
      setSubmitting(false)
    }
  }

  const attemptSubmit = () => {
    if (answeredCount < questions.length) {
      setConfirmSkip(true)
      return
    }
    handleSubmit()
  }

  if (loading) {
    return <div className={styles.center}><Spinner /></div>
  }

  if (error && questions.length === 0) {
    return (
      <div className={styles.center}>
        <div className={styles.loadError}>
          <p>{error}</p>
          <button className={styles.exitBtn} onClick={() => navigate(-1)}>← Go back</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.screen}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <button className={styles.exitBtn} onClick={() => navigate(-1)} aria-label="Exit quiz">
          ✕
        </button>
        <div className={styles.topBarCenter}>
          <span className={styles.phaseLabel}>{quizMeta?.phaseTitle || `Phase ${phaseNumber}`} Quiz</span>
          <span className={styles.questionCounter}>
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className={styles.timer}>⏱ {formatElapsed(elapsed)}</div>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question workspace */}
      <div className={styles.workspace}>
        {current && (
          <QuestionCard
            question={current}
            selected={answers[current.id] ?? null}
            onSelect={(key) => selectAnswer(current.id, key)}
          />
        )}
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* Footer nav */}
      <div className={styles.footer}>
        <button
          className={styles.navBtn}
          onClick={() => goTo(currentIndex - 1)}
          disabled={currentIndex === 0}
        >
          ← Previous
        </button>

        <div className={styles.dots}>
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`${styles.dot} ${i === currentIndex ? styles.dotActive : ''} ${
                answers[q.id] != null ? styles.dotAnswered : ''
              }`}
              onClick={() => goTo(i)}
              aria-label={`Go to question ${i + 1}`}
            />
          ))}
        </div>

        {currentIndex < questions.length - 1 ? (
          <button className={styles.navBtn} onClick={() => goTo(currentIndex + 1)}>
            Next →
          </button>
        ) : (
          <button className={styles.submitBtn} onClick={attemptSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Quiz'}
          </button>
        )}
      </div>

      {confirmSkip && (
        <div className={styles.modalOverlay} onClick={() => setConfirmSkip(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Unanswered questions</h3>
            <p>
              You've answered {answeredCount} of {questions.length} questions. Submit anyway?
            </p>
            <div className={styles.modalActions}>
              <button className={styles.navBtn} onClick={() => setConfirmSkip(false)}>
                Review answers
              </button>
              <button className={styles.submitBtn} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionCard({ question, selected, onSelect }) {
  const optionEntries = Object.entries(question.options || {})

  return (
    <div className={styles.questionCard}>
      <span className={styles.typeBadge}>{typeLabel(question.type)}</span>
      <p className={styles.questionText}>{question.text}</p>

      {question.codeSnippet && (
        <pre className={styles.codeBlock}>
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      <div className={styles.optionsGrid}>
        {optionEntries.map(([key, label]) => (
          <button
            key={key}
            className={`${styles.optionCard} ${selected === key ? styles.optionSelected : ''}`}
            onClick={() => onSelect(key)}
          >
            <span className={styles.optionKey}>{key}</span>
            <span className={styles.optionLabel}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function typeLabel(type) {
  switch (type) {
    case 'true-false': return 'True / False'
    case 'code-review': return 'Code Review'
    default: return 'Multiple Choice'
  }
}