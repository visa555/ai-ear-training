import { useEffect, useState } from 'react'
import { stopAll } from '../audio/engine'
import { playGuitarNote } from '../audio/guitar'
import { levelPool, noteAt, positionId, type FretNote, type GuitarLevel } from '../guitar/fretboard'
import { answerNames, correctFrets, generateGuitarQuestions, isCorrectFret } from '../guitar/logic'
import { useCountdown } from '../lib/useCountdown'
import { prettyNote } from '../theory/keys'
import type { GuitarMode } from '../storage/guitarProgress'
import { Confetti } from './Confetti'
import { Fretboard, type FretMark } from './Fretboard'
import { GameTopActions } from './GameTopActions'
import { Mascot, type MascotMood } from './Mascot'
import { TimerBar } from './TimerControls'

export interface GuitarConfig {
  level: GuitarLevel
  mode: GuitarMode
  count: number
  /** เวลาตอบต่อข้อ (วินาที) 0 = ไม่จับเวลา */
  timeLimit: number
  /** แสดงชื่อโน้ตบนคอระหว่างเล่น (ล้อช่วย) */
  labels: boolean
}

export interface GuitarAnswer {
  question: FretNote
  /** โหมด find/listen: ช่องที่แตะ · โหมด name: ชื่อโน้ตที่เลือก · null = หมดเวลา */
  chosen: { string: number; fret: number } | string | null
  correct: boolean
}

interface Props {
  config: GuitarConfig
  weight?: (note: FretNote) => number
  onDone: (answers: GuitarAnswer[]) => void
  onRestart: () => void
  onQuit: () => void
}

const PRAISE = ['เก่งมาก!', 'จำแม่นจัง!', 'สุดยอด!', 'นิ้วไวมาก!', 'เยี่ยมเลย!']
const COMFORT = ['เกือบแล้ว!', 'ไม่เป็นไรนะ!', 'ลองดูใหม่นะ!']

const isCell = (chosen: GuitarAnswer['chosen']): chosen is { string: number; fret: number } =>
  typeof chosen === 'object' && chosen !== null

/** ชื่อโน้ตพร้อมสัญลักษณ์ ♯ ในกล่องสี */
const chip = (note: { pc: string; letterIndex: number }) => (
  <b className={`chip deg-${note.letterIndex + 1}`}>{prettyNote(note.pc)}</b>
)

export function GuitarPlay({ config, weight, onDone, onRestart, onQuit }: Props) {
  const { level, mode } = config
  const [pool] = useState(() => levelPool(level))
  const [questions] = useState(() => generateGuitarQuestions(pool, config.count, Math.random, weight))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<GuitarAnswer[]>([])
  const question = questions[index]
  const last = answers[index]
  const answered = last !== undefined
  const score = answers.filter((a) => a.correct).length
  const timedOut = answered && last.chosen === null
  const letters = mode === 'name' ? answerNames(pool) : []

  useEffect(() => stopAll, [])

  // โหมดฟังเสียง: เล่นเสียงโน้ตของข้อนี้ให้ฟังเมื่อขึ้นข้อใหม่
  useEffect(() => {
    if (mode === 'listen') playGuitarNote(question.midi)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode])

  const answer = (chosen: GuitarAnswer['chosen']) => {
    if (answered) return
    const correct = isCell(chosen) ? isCorrectFret(question, chosen.string, chosen.fret) : chosen === question.pc
    setAnswers((prev) => [...prev, { question, chosen, correct }])
    // โหมดที่แตะคอ เล่นเสียงช่องที่แตะ · โหมดบอกชื่อ เล่นเสียงช่องที่ถาม
    playGuitarNote(isCell(chosen) ? noteAt(chosen.string, chosen.fret).midi : question.midi)
    if (!correct && isCell(chosen)) window.setTimeout(() => playGuitarNote(question.midi), 900)
  }

  const remaining = useCountdown({
    seconds: config.timeLimit,
    running: !answered,
    resetKey: index,
    onExpire: () => answer(null),
  })

  const next = () => {
    if (!answered) return
    if (index + 1 >= questions.length) onDone(answers)
    else setIndex(index + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const letter = e.key.toUpperCase()
      if (mode === 'name' && !answered && letters.includes(letter)) answer(letter)
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (answered) next()
        else if (mode === 'listen') playGuitarNote(question.midi)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const marks: Record<string, FretMark> = {}
  if (config.labels && !answered) {
    // ล้อช่วย: โชว์ชื่อโน้ตตัวอื่นบนสายที่ถาม ให้นับหาคำตอบได้ (ไม่โชว์คำตอบ)
    for (let fret = 0; fret <= level.showFrets; fret++) {
      const note = noteAt(question.string, fret)
      if (note.natural && note.pc !== question.pc) {
        marks[positionId(note)] = { state: 'hint', label: prettyNote(note.pc), className: `deg-${note.letterIndex + 1}` }
      }
    }
  }
  if (mode === 'name' && !answered) {
    marks[positionId(question)] = { state: 'ask', label: '?' }
  }
  if (answered) {
    if (mode === 'name') {
      marks[positionId(question)] = { state: last.correct ? 'correct' : 'wrong', label: prettyNote(question.pc) }
    } else {
      for (const fret of correctFrets(question, level.showFrets)) {
        marks[positionId({ string: question.string, fret })] = { state: 'correct', label: prettyNote(question.pc) }
      }
      if (isCell(last.chosen) && !last.correct) {
        const chosen = noteAt(last.chosen.string, last.chosen.fret)
        marks[positionId(chosen)] = { state: 'wrong', label: prettyNote(chosen.pc) }
      }
    }
  }

  let mood: MascotMood = mode === 'listen' && !answered ? 'listen' : 'idle'
  let speech =
    mode === 'find' ? (
      <>
        หาโน้ต {chip(question)} บน<b>สาย {question.string}</b> แล้วแตะช่องนั้นเลย 🎸
      </>
    ) : mode === 'listen' ? (
      <>
        ฟังเสียงที่ได้ยิน แล้วหาว่าเป็นช่องไหนบน<b>สาย {question.string}</b> 👂🎸
      </>
    ) : (
      <>
        ช่องที่มีเครื่องหมาย <b>?</b> บน<b>สาย {question.string} เฟรต {question.fret}</b> คือโน้ตอะไรเอ่ย? 🤔
      </>
    )
  if (last?.correct) {
    mood = 'happy'
    speech = (
      <>
        <b>{PRAISE[index % PRAISE.length]}</b> สาย {question.string} เฟรต{' '}
        {isCell(last.chosen) ? last.chosen.fret : question.fret} คือ {chip(question)} ถูกต้อง
      </>
    )
  } else if (last) {
    mood = 'oops'
    speech =
      mode === 'name' ? (
        <>
          <b>{timedOut ? '⏰ หมดเวลา! ไม่เป็นไรนะ' : COMFORT[index % COMFORT.length]}</b> สาย {question.string} เฟรต{' '}
          {question.fret} คือ {chip(question)}
          {typeof last.chosen === 'string' && <> ไม่ใช่ {prettyNote(last.chosen)}</>}
        </>
      ) : (
        <>
          <b>{timedOut ? '⏰ หมดเวลา! ไม่เป็นไรนะ' : COMFORT[index % COMFORT.length]}</b> {chip(question)} บนสาย{' '}
          {question.string} อยู่ที่เฟรต <b>{correctFrets(question, level.showFrets).join(' หรือ ')}</b>
          {isCell(last.chosen) && <> · ที่แตะคือ {prettyNote(noteAt(last.chosen.string, last.chosen.fret).pc)}</>}
        </>
      )
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="pill">🎸 {level.name}</span>
        <span className="pill">
          ข้อ {index + 1}/{questions.length}
        </span>
        <span className="pill">⭐ {score}</span>
        <GameTopActions onRestart={onRestart} onQuit={onQuit} />
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      {config.timeLimit > 0 && <TimerBar remainingMs={remaining} seconds={config.timeLimit} />}

      <div className="stage">
        {last?.correct && <Confetti key={index} />}
        <Mascot mood={mood}>{speech}</Mascot>
      </div>

      <div className="fretboard-scroll">
        <Fretboard
          frets={level.showFrets}
          activeStrings={[question.string]}
          marks={marks}
          onPress={mode !== 'name' && !answered ? (string, fret) => answer({ string, fret }) : undefined}
          ariaLabel={
            mode === 'name'
              ? `คอกีตาร์ ช่องที่ถามคือสาย ${question.string} เฟรต ${question.fret}`
              : `คอกีตาร์ หาโน้ตบนสาย ${question.string}`
          }
        />
      </div>

      {mode === 'name' && (
        <div className="letter-pad">
          {letters.map((l) => {
            let state = ''
            if (answered) {
              if (l === question.pc) state = 'right'
              else if (l === last.chosen) state = 'wrong'
              else state = 'dim'
            }
            return (
              <button key={l} className={state} disabled={answered} onClick={() => answer(l)}>
                <span className="big">{prettyNote(l)}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="actions">
        {mode === 'listen' && !answered && (
          <button className="primary" onClick={() => playGuitarNote(question.midi)}>
            🔁 ฟังเสียงอีกครั้ง
          </button>
        )}
        {answered && <button onClick={() => playGuitarNote(question.midi)}>🔊 ฟังเสียงโน้ตนี้</button>}
        {answered && (
          <button className="primary" onClick={next}>
            {index + 1 < questions.length ? 'ข้อต่อไป ➜' : 'ดูผลลัพธ์ 🏆'}
          </button>
        )}
      </div>
      <p className="hint">
        {mode === 'name'
          ? '⌨️ แตะปุ่มชื่อโน้ต หรือกดตัวอักษรบนแป้นพิมพ์'
          : mode === 'listen'
            ? '👂 กดฟังซ้ำได้ไม่จำกัด (Enter) · แตะช่องบนสายที่กำลังถาม'
            : '👆 แตะช่องบนสายที่กำลังถาม · สายอื่นจะจางลงไว้ไม่ให้สับสน'}
      </p>
    </div>
  )
}
