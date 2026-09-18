import { useCallback, useState } from 'react'
import type { ScaleNote } from '../theory/keys'
import { buildPool, generateQuestions, type Answer, type QuizConfig } from './generator'

interface Session {
  config: QuizConfig
  questions: ScaleNote[]
  index: number
  answers: Answer[]
}

export type QuizPhase = 'setup' | 'question' | 'feedback' | 'done'

export function useQuiz() {
  const [session, setSession] = useState<Session | null>(null)

  const start = useCallback((config: QuizConfig, weight?: (note: ScaleNote) => number) => {
    const pool = buildPool(config.key, config.degrees, config.octaves)
    setSession({ config, questions: generateQuestions(pool, config.count, Math.random, weight), index: 0, answers: [] })
  }, [])

  const answer = useCallback((degree: number) => {
    setSession((s) => {
      if (!s || s.answers.length > s.index || s.index >= s.questions.length) return s
      const question = s.questions[s.index]
      return { ...s, answers: [...s.answers, { question, chosen: degree, correct: degree === question.degree }] }
    })
  }, [])

  const next = useCallback(() => {
    setSession((s) => (s && s.answers.length > s.index ? { ...s, index: s.index + 1 } : s))
  }, [])

  const reset = useCallback(() => setSession(null), [])

  let phase: QuizPhase = 'setup'
  if (session) {
    if (session.index >= session.questions.length) phase = 'done'
    else phase = session.answers.length > session.index ? 'feedback' : 'question'
  }

  return {
    phase,
    session,
    question: session?.questions[session.index],
    lastAnswer: session?.answers[session.index],
    start,
    answer,
    next,
    reset,
  }
}
