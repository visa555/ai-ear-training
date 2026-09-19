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
import { useCountdown } from '../lib/useCountdown'
import { Confetti } from './Confetti'
import { GameTopActions } from './GameTopActions'
import { Mascot, type MascotMood } from './Mascot'
import { PianoKeyboard, type KeyMark } from './PianoKeyboard'
import { TimerBar } from './TimerControls'

interface Props {
  config: QuizConfig
  question: ScaleNote
  index: number
  total: number
  score: number
  streak: number
  lastAnswer?: Answer
  onAnswer: (degree: number) => void
  onNext: () => void
  onRestart: () => void
  onQuit: () => void
}

const PAUSE: Step = { midis: [], duration: 0, next: 0.4 }

const PRAISE = ['เก่งมาก!', 'สุดยอดเลย!', 'ถูกต้องนะ!', 'หูทองจริงๆ!', 'เยี่ยมไปเลย!', 'ว้าว เก่งจัง!']
const COMFORT = ['เกือบแล้ว!', 'ไม่เป็นไรนะ!', 'ใกล้แล้ว!', 'ลองใหม่ได้!']

function name(n: ScaleNote) {
  return (
    <>
      <b className={`chip deg-${n.degree}`}>{n.solfege}</b> (ตัวที่ {n.degree} · {prettyNote(n.pc)})
    </>
  )
}

export function QuizRunner(props: Props) {
  const { config, question, index, total, score, streak, lastAnswer, onAnswer, onNext, onRestart, onQuit } = props
  const { key } = config
  const [active, setActive] = useState<number[]>([])
  const [playing, setPlaying] = useState(false)
  const root = tonicMidi(key)
  const answered = lastAnswer !== undefined

  /** โน้ตทุกขั้นในช่วงเสียงของเกม (ใช้ทั้งวาดคีย์บอร์ดและแปลงคีย์ที่กดเป็นคำตอบ) */
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

  // ตอบผิดแล้วพาโน้ตกลับบ้านให้ฟังทันที
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

  // จับเวลาเฉพาะตอนที่เด็กตอบได้: หยุดระหว่างเล่นเสียง และเริ่มใหม่ทุกข้อ · หมดเวลา = ตอบ 0 (นับเป็นผิด)
  const remaining = useCountdown({
    seconds: config.timeLimit,
    running: !answered && !playing,
    resetKey: index,
    onExpire: () => {
      stopAll()
      setPlaying(false)
      onAnswer(0)
    },
  })
  const timedOut = lastAnswer?.chosen === 0

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
    const inGame = config.degrees.includes(n.degree)
    marks[n.midi] = {
      tone: n.degree === 1 ? 'tonic' : 'scale',
      degree: inGame ? n.degree : undefined,
      label: inGame ? noteLabel(n, config.labelMode) : undefined,
    }
  }
  if (lastAnswer) {
    marks[question.midi] = { ...marks[question.midi], tone: 'correct' }
    if (!lastAnswer.correct && !timedOut) {
      const chosen = scaleNotes(key, question.octaveShift)[lastAnswer.chosen - 1]
      marks[chosen.midi] = { ...marks[chosen.midi], tone: 'wrong' }
    }
  }

  let mood: MascotMood = playing ? 'listen' : 'idle'
  let speech = playing ? <>ตั้งใจฟังนะ… 👂</> : <>โน้ตที่ซ่อนอยู่คือตัวไหนเอ่ย? 🤔</>
  if (lastAnswer?.correct) {
    mood = 'happy'
    speech = (
      <>
        <b>{PRAISE[index % PRAISE.length]}</b> นั่นคือ {name(question)}
        {streak >= 3 && <span className="streak-inline"> 🔥 ถูกติดกัน {streak} ข้อ!</span>}
      </>
    )
  } else if (lastAnswer) {
    mood = 'oops'
    speech = (
      <>
        <b>{timedOut ? '⏰ หมดเวลา! ไม่เป็นไรนะ' : COMFORT[index % COMFORT.length]}</b> โน้ตนั้นคือ {name(question)}
        <br />
        ฟังฉันพาโน้ตกลับบ้านนะ 🏠
      </>
    )
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="pill">🗝️ {keyName(key)}</span>
        <span className="pill">
          ข้อ {index + 1}/{total}
        </span>
        <span className="pill">⭐ {score}</span>
        {streak >= 2 && <span className="pill fire">🔥 {streak}</span>}
        <GameTopActions onRestart={onRestart} onQuit={onQuit} />
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${((index + (answered ? 1 : 0)) / total) * 100}%` }} />
      </div>
      {config.timeLimit > 0 && (
        <TimerBar remainingMs={remaining} seconds={config.timeLimit} paused={playing && !answered} />
      )}

      <div className="stage">
        {lastAnswer?.correct && <Confetti key={index} />}
        <Mascot mood={mood}>{speech}</Mascot>
      </div>

      <div className="answer-pad">
        {config.degrees.map((d) => {
          const n = scaleNotes(key)[d - 1]
          let state = ''
          if (lastAnswer) {
            if (d === question.degree) state = ' right'
            else if (d === lastAnswer.chosen) state = ' wrong'
            else state = ' dim'
          }
          return (
            <button key={d} className={`deg-${d}${state}`} disabled={answered} onClick={() => handleAnswer(d)}>
              <span className="big">{noteLabel(n, config.labelMode)}</span>
              {config.labelMode !== 'degree' && <small>{d === 1 ? '🏠' : d}</small>}
              {state === ' right' && <span className="mark">✓</span>}
              {state === ' wrong' && <span className="mark">✗</span>}
            </button>
          )
        })}
      </div>

      <PianoKeyboard {...range} marks={marks} active={active} onPress={handleKeyPress} />

      <div className="actions">
        <button onClick={() => playQuestion(false)}>🔁 ฟังอีกครั้ง</button>
        <button onClick={() => playQuestion(true)}>🎶 ฟังเพลงบอกบ้าน</button>
        <button onClick={() => run([{ midis: [root], duration: 1.2 }], true)}>🏠 ฟังโน้ตบ้าน</button>
        {answered && <button onClick={playResolution}>🪜 พากลับบ้าน</button>}
        {answered && (
          <button className="primary" onClick={onNext}>
            {index + 1 < total ? 'ข้อต่อไป ➜' : 'ดูผลลัพธ์ 🏆'}
          </button>
        )}
      </div>
      <p className="hint">⌨️ ปุ่มลัด: กด 1–7 เพื่อตอบ · Enter ฟังซ้ำ/ข้อต่อไป · C ฟังเพลงบอกบ้าน</p>
    </div>
  )
}
