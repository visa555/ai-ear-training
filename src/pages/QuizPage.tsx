import { useEffect, useState } from 'react'
import { ensureAudio } from '../audio/engine'
import { QuizRunner } from '../components/QuizRunner'
import { QuizSetup } from '../components/QuizSetup'
import { QuizSummary } from '../components/QuizSummary'
import { currentStreak, degreeWeight, type QuizConfig } from '../quiz/generator'
import { useQuiz } from '../quiz/useQuiz'
import { keyId, loadProgress, recordSession } from '../storage/progress'
import type { KeyDef, LabelMode } from '../theory/keys'

interface Props {
  keyDef: KeyDef
  onKeyChange: (key: KeyDef) => void
  labelMode: LabelMode
  onLabelModeChange: (mode: LabelMode) => void
}

/** กันไม่ให้บันทึกรอบเดียวกันซ้ำ (เช่น effect รันสองครั้งใน StrictMode) */
const recorded = new WeakSet<object>()

export function QuizPage(props: Props) {
  const quiz = useQuiz()
  const [loading, setLoading] = useState(false)
  /** เปลี่ยนทุกครั้งที่เริ่มรอบใหม่ ให้หน้าจอเกมเริ่มต้นใหม่ทั้งหมด (รวมถึงเล่นเสียงข้อแรกใหม่) */
  const [round, setRound] = useState(0)
  const { session } = quiz

  const begin = (config: QuizConfig) => {
    setRound((r) => r + 1)
    if (!config.adaptive) return quiz.start(config)
    const tallies = loadProgress().byKey[keyId(config.key)] ?? {}
    quiz.start(config, (note) => degreeWeight(tallies[note.degree]))
  }

  const start = async (config: QuizConfig) => {
    setLoading(true)
    await ensureAudio()
    setLoading(false)
    begin(config)
  }

  useEffect(() => {
    if (quiz.phase === 'done' && session && !recorded.has(session)) {
      recorded.add(session)
      recordSession(session.config.key, session.answers)
    }
  }, [quiz.phase, session])

  return (
    <section className="page">
      {quiz.phase === 'setup' && <QuizSetup {...props} onStart={start} loading={loading} />}

      {session && quiz.question && (
        <QuizRunner
          key={round}
          config={session.config}
          question={quiz.question}
          index={session.index}
          total={session.questions.length}
          score={session.answers.filter((a) => a.correct).length}
          streak={currentStreak(session.answers)}
          lastAnswer={quiz.lastAnswer}
          onAnswer={quiz.answer}
          onNext={quiz.next}
          onRestart={() => begin(session.config)}
          onQuit={quiz.reset}
        />
      )}

      {session && quiz.phase === 'done' && (
        <QuizSummary
          config={session.config}
          answers={session.answers}
          onRetry={() => begin(session.config)}
          onSetup={quiz.reset}
        />
      )}
    </section>
  )
}
