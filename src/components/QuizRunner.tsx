import { useCallback, useEffect, useMemo, useState } from 'react'
import { cadenceSteps } from '../audio/cadence'
import { playNotes, playSequence, stopAll, type Step } from '../audio/engine'
import { buildPool, resolutionPath, type Answer, type QuizConfig } from '../quiz/generator'
import {
  DEGREES,
  isMinor,
  keyboardRange,
  keyName,
  noteLabel,
  prettyNote,
  scaleNotes,
  tonicMidi,
  type ScaleNote,
} from '../theory/keys'
import { PianoKeyboard, type KeyMark } from './PianoKeyboard'

interface Props {
  config: QuizConfig
  question: ScaleNote
  index: number
  total: number
  score: number
  lastAnswer?: Answer
  onAnswer: (degree: number) => void
  onNext: () => void
  onQuit: () => void
}

const PAUSE: Step = { midis: [], duration: 0, next: 0.4 }

function describe(n: ScaleNote) {
  return `ขั้นที่ ${n.degree} (${n.solfege} · ${prettyNote(n.pc)})`
}

export function QuizRunner({ config, question, index, total, score, lastAnswer, onAnswer, onNext, onQuit }: Props) {
  const { key } = config
  const [active, setActive] = useState<number[]>([])
  const [playing, setPlaying] = useState(false)
  const root = tonicMidi(key)
  const answered = lastAnswer !== undefined

  /** โน๊ตทุกขั้นในช่วงเสียงของแบบทดสอบ (ใช้ทั้งวาดคีย์บอร์ดและแปลงคีย์ที่กดเป็นคำตอบ) */
  const fullRange = useMemo(() => buildPool(key, [...DEGREES], config.octaves), [key, config.octaves])
  const range = keyboardRange(fullRange[0].midi, fullRange[fullRange.length - 1].midi)
  const scaleByMidi = new Map(fullRange.map((n) => [n.midi, n]))

  const run = useCallback(async (steps: Step[], showKeys: boolean) => {
    setPlaying(true)
    const done = await playSequence(steps, showKeys ? setActive : undefined)
    if (done) setPlaying(false)
  }, [])

  const noteStep: Step = { midis: [question.midi], duration: 1.5 }
  const playQuestion = (withCadence: boolean) =>
    run(withCadence ? [...cadenceSteps(root, isMinor(key.mode)), PAUSE, noteStep] : [noteStep], false)
  const playResolution = () =>
    run(
      resolutionPath(key, question).map((n, i, all) => ({
        midis: [n.midi],
        duration: i === all.length - 1 ? 1.2 : 0.45,
        next: 0.45,
      })),
      true,
    )

  // เล่นเสียงอัตโนมัติเมื่อขึ้นข้อใหม่
  useEffect(() => {
    setActive([])
    void playQuestion(index === 0 || config.cadenceEvery)
    return stopAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // ตอบผิดแล้วเล่นการ resolve ให้ฟังทันที
  useEffect(() => {
    if (lastAnswer && !lastAnswer.correct) void playResolution()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastAnswer])

  const handleAnswer = (degree: number) => {
    if (answered || !config.degrees.includes(degree)) return
    stopAll()
    setPlaying(false)
    onAnswer(degree)
  }

  const handleKeyPress = (midi: number) => {
    if (answered) {
      playNotes([midi], 1)
      return
    }
    const note = scaleByMidi.get(midi)
    if (note) handleAnswer(note.degree)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const digit = Number(e.key)
      if (digit >= 1 && digit <= 7) handleAnswer(digit)
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (answered) onNext()
        else void playQuestion(false)
      } else if (e.key.toLowerCase() === 'c') void playQuestion(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const marks: Record<number, KeyMark> = {}
  for (const n of fullRange) {
    marks[n.midi] = {
      tone: n.degree === 1 ? 'tonic' : 'scale',
      label: config.degrees.includes(n.degree) ? noteLabel(n, config.labelMode) : undefined,
    }
  }
  if (lastAnswer) {
    marks[question.midi] = { ...marks[question.midi], tone: 'correct' }
    if (!lastAnswer.correct) {
      const chosen = scaleNotes(key, question.octaveShift)[lastAnswer.chosen - 1]
      marks[chosen.midi] = { ...marks[chosen.midi], tone: 'wrong' }
    }
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span>
          คีย์ <strong>{keyName(key)}</strong>
        </span>
        <span>
          ข้อ {index + 1}/{total} · ถูก {score}
        </span>
        <button className="ghost small" onClick={onQuit}>
          ออก
        </button>
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
      </div>

      <div className={`prompt${lastAnswer ? (lastAnswer.correct ? ' good' : ' bad') : ''}`}>
        {!lastAnswer && <p>{playing ? '🎧 กำลังเล่นเสียง…' : 'โน๊ตที่ได้ยินคือขั้นที่เท่าไร?'}</p>}
        {lastAnswer?.correct && <p>✓ ถูกต้อง! {describe(question)}</p>}
        {lastAnswer && !lastAnswer.correct && (
          <p>
            ✗ คุณตอบ {describe(scaleNotes(key)[lastAnswer.chosen - 1])}
            <br />
            คำตอบคือ {describe(question)}
          </p>
        )}
      </div>

      <div className="answer-pad">
        {config.degrees.map((d) => {
          const n = scaleNotes(key)[d - 1]
          let cls = ''
          if (lastAnswer) {
            if (d === question.degree) cls = 'good'
            else if (d === lastAnswer.chosen) cls = 'bad'
          }
          return (
            <button key={d} className={cls} disabled={answered} onClick={() => handleAnswer(d)}>
              <span className="big">{noteLabel(n, config.labelMode)}</span>
              {config.labelMode !== 'degree' && <small>{d}</small>}
            </button>
          )
        })}
      </div>

      <PianoKeyboard {...range} marks={marks} active={active} onPress={handleKeyPress} />

      <div className="actions">
        <button onClick={() => playQuestion(false)}>🔁 ฟังโน๊ตอีกครั้ง</button>
        <button onClick={() => playQuestion(true)}>🎹 ฟัง cadence + โน๊ต</button>
        <button onClick={() => run([{ midis: [root], duration: 1.2 }], true)}>ฟังโทนิก (Do)</button>
        {answered && <button onClick={playResolution}>ฟังการ resolve</button>}
        {answered && (
          <button className="primary" onClick={onNext}>
            {index + 1 < total ? 'ข้อต่อไป →' : 'ดูผลลัพธ์'}
          </button>
        )}
      </div>
      <p className="hint">คีย์ลัด: กด 1–7 เพื่อตอบ · Enter ฟังซ้ำ/ข้อต่อไป · C ฟัง cadence</p>
    </div>
  )
}
