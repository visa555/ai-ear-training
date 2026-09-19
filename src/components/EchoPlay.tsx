import { useEffect, useMemo, useRef, useState } from 'react'
import { cadenceSteps } from '../audio/cadence'
import { playNotes, playSequence, stopAll, type Step } from '../audio/engine'
import { checkInput, extendSequence, MAX_HEARTS, startSequence } from '../echo/logic'
import { useCountdown } from '../lib/useCountdown'
import { buildPool } from '../quiz/generator'
import {
  isMinor,
  keyboardRange,
  keyName,
  scaleWithTopTonic,
  tonicMidi,
  type KeyDef,
  type LabelMode,
  type ScaleNote,
  noteLabel,
} from '../theory/keys'
import { Confetti } from './Confetti'
import { GameTopActions } from './GameTopActions'
import { Mascot, type MascotMood } from './Mascot'
import { PianoKeyboard, type KeyMark } from './PianoKeyboard'
import { TimerBar } from './TimerControls'

export interface EchoConfig {
  key: KeyDef
  degrees: number[]
  labelMode: LabelMode
  /** ให้เปียโนกระพริบตามโน้ตที่น้องฮูกเล่น (โหมดง่าย) */
  lights: boolean
  /** เวลากดต่อโน้ต (วินาที) 0 = ไม่จับเวลา */
  timeLimit: number
}

interface Props {
  config: EchoConfig
  best: number
  onFinish: (longest: number) => void
  onRestart: () => void
  onQuit: () => void
}

type Phase = 'listen' | 'turn' | 'success' | 'oops'

const PAUSE: Step = { midis: [], duration: 0, next: 0.5 }
const PRAISE = ['เก่งมาก!', 'จำได้เป๊ะเลย!', 'สุดยอด!', 'หูทองจริงๆ!', 'ว้าว!']

export function EchoPlay({ config, best, onFinish, onRestart, onQuit }: Props) {
  const { key, degrees, labelMode, lights } = config
  const root = tonicMidi(key)
  const pool = useMemo(() => buildPool(key, degrees, 1), [key, degrees])
  /** โน้ตทุกตัวของสเกล (รวมโดตัวบน) ใช้แปลงคีย์เปียโนที่กดเป็นขั้น */
  const fullScale = useMemo(() => scaleWithTopTonic(key), [key])
  const range = keyboardRange(fullScale[0].midi, fullScale[fullScale.length - 1].midi)

  const [sequence, setSequence] = useState<ScaleNote[]>(() => startSequence(pool))
  const [phase, setPhase] = useState<Phase>('listen')
  const [inputIndex, setInputIndex] = useState(0)
  const [hearts, setHearts] = useState(MAX_HEARTS)
  const [longest, setLongest] = useState(0)
  const [active, setActive] = useState<number[]>([])
  const [round, setRound] = useState(1)
  const [wrongAt, setWrongAt] = useState<number | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  /** นับจำนวนครั้งที่เล่นทำนอง ใช้เริ่มจับเวลาใหม่ทุกครั้งที่ถึงตาเด็ก */
  const [playCount, setPlayCount] = useState(0)

  const timers = useRef<number[]>([])
  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms))
  }

  const play = async (seq: ScaleNote[], withCadence: boolean) => {
    setPhase('listen')
    setInputIndex(0)
    setWrongAt(null)
    setTimedOut(false)
    setPlayCount((c) => c + 1)
    setActive([])
    const steps: Step[] = [
      ...(withCadence ? [...cadenceSteps(root, isMinor(key.mode)), PAUSE] : []),
      ...seq.map((n) => ({ midis: [n.midi], duration: 0.6, next: 0.75 })),
    ]
    // กระพริบเฉพาะโน้ตของทำนอง ไม่กระพริบคอร์ด
    const done = await playSequence(steps, lights ? (m) => setActive(m.length === 1 ? m : []) : undefined)
    if (done) setPhase('turn')
  }

  // เริ่มเกม: เล่นเพลงบอกบ้านแล้วตามด้วยทำนองแรก
  useEffect(() => {
    void play(sequence, true)
    const pending = timers.current
    return () => {
      pending.forEach(clearTimeout)
      pending.length = 0
      stopAll()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flash = (midi: number) => {
    setActive([midi])
    later(() => setActive((cur) => (cur.length === 1 && cur[0] === midi ? [] : cur)), 350)
  }

  const press = (degree: number, midi: number) => {
    if (phase !== 'turn') return
    playNotes([midi], 0.6)
    flash(midi)
    const result = checkInput(sequence, inputIndex, degree)

    if (result === 'next') {
      setInputIndex(inputIndex + 1)
    } else if (result === 'complete') {
      const newLongest = Math.max(longest, sequence.length)
      setLongest(newLongest)
      setInputIndex(sequence.length)
      setPhase('success')
      later(() => {
        const next = extendSequence(sequence, pool)
        setSequence(next)
        setRound((r) => r + 1)
        void play(next, false)
      }, 1600)
    } else {
      fail()
    }
  }

  /** กดผิดหรือหมดเวลา: เสียหัวใจ แล้วเล่นทำนองเดิมให้ลองใหม่ (หรือจบเกมถ้าหัวใจหมด) */
  const fail = (outOfTime = false) => {
    const left = hearts - 1
    setHearts(left)
    setWrongAt(inputIndex)
    setTimedOut(outOfTime)
    setPhase('oops')
    if (left <= 0) later(() => onFinish(longest), 1800)
    else later(() => void play(sequence, false), 1800)
  }

  // จับเวลาต่อโน้ต: เริ่มใหม่ทุกครั้งที่กดถูกหนึ่งตัว และทุกครั้งที่เล่นทำนองซ้ำ
  const remaining = useCountdown({
    seconds: config.timeLimit,
    running: phase === 'turn',
    resetKey: `${playCount}-${inputIndex}`,
    onExpire: () => fail(true),
  })

  const pressDegree = (degree: number) => {
    const note = pool.find((n) => n.degree === degree)
    if (note) press(degree, note.midi)
  }

  const pressKey = (midi: number) => {
    const note = fullScale.find((n) => n.midi === midi)
    if (note && phase === 'turn') press(note.degree, midi)
    else playNotes([midi], 0.6)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const digit = Number(e.key)
      if (digit >= 1 && digit <= 7 && degrees.includes(digit)) pressDegree(digit)
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (phase === 'turn') void play(sequence, false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const marks: Record<number, KeyMark> = {}
  for (const n of fullScale) {
    const inGame = degrees.includes(n.degree)
    marks[n.midi] = {
      tone: n.degree === 1 ? 'tonic' : 'scale',
      degree: inGame ? n.degree : undefined,
      label: inGame ? noteLabel(n, labelMode) : undefined,
    }
  }

  const canReplay = phase === 'turn' || phase === 'listen'
  let mood: MascotMood = 'listen'
  let speech = (
    <>
      ฟังให้ดีนะ… ฉันจะเล่น <b>{sequence.length} โน้ต</b> 👂
    </>
  )
  if (phase === 'turn') {
    mood = 'idle'
    speech = (
      <>
        ถึงตาหนูแล้ว! กดตามให้เหมือนฉันนะ 🎹 ({inputIndex}/{sequence.length})
      </>
    )
  } else if (phase === 'success') {
    mood = 'happy'
    speech = (
      <>
        <b>{PRAISE[(round - 1) % PRAISE.length]}</b> จำได้ครบ {sequence.length} โน้ต · รอบหน้ายาวขึ้นอีกนิดนะ!
      </>
    )
  } else if (phase === 'oops') {
    mood = 'oops'
    speech =
      hearts > 0 ? (
        <>
          <b>{timedOut ? '⏰ หมดเวลา!' : 'อุ๊ย เกือบแล้ว!'}</b> ไม่เป็นไรนะ ฟังอีกทีแล้วลองใหม่ 💪
        </>
      ) : (
        <>
          <b>หัวใจหมดแล้ว</b> เก่งมากที่เล่นมาถึงตรงนี้! ไปดูผลกัน 🏆
        </>
      )
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="pill">🗝️ {keyName(key)}</span>
        <span className="pill">รอบ {round}</span>
        <span className="pill hearts" aria-label={`เหลือหัวใจ ${hearts} ดวง`}>
          {'❤️'.repeat(hearts)}
          {'🤍'.repeat(MAX_HEARTS - hearts)}
        </span>
        {best > 0 && <span className="pill">🏅 สถิติ {best}</span>}
        <GameTopActions onRestart={onRestart} onQuit={onQuit} />
      </div>

      {config.timeLimit > 0 && (
        <TimerBar remainingMs={remaining} seconds={config.timeLimit} paused={phase === 'listen'} />
      )}

      <div className="seq-dots" aria-label={`ทำนองยาว ${sequence.length} โน้ต`}>
        {sequence.map((n, i) => {
          const done = i < inputIndex
          const wrong = wrongAt === i
          return (
            <span
              key={i}
              className={`seq-dot${done ? ` filled deg-${n.degree}` : ''}${wrong ? ' wrong' : ''}${
                i === inputIndex && phase === 'turn' ? ' current' : ''
              }`}
            >
              {done ? noteLabel(n, labelMode) : wrong ? '✗' : '?'}
            </span>
          )
        })}
      </div>

      <div className="stage">
        {phase === 'success' && <Confetti key={round} />}
        <Mascot mood={mood}>{speech}</Mascot>
      </div>

      <div className={`answer-pad${phase === 'turn' ? '' : ' waiting'}`}>
        {pool.map((n) => (
          <button key={n.degree} className={`deg-${n.degree}`} disabled={phase !== 'turn'} onClick={() => pressDegree(n.degree)}>
            <span className="big">{noteLabel(n, labelMode)}</span>
            {labelMode !== 'degree' && <small>{n.degree === 1 ? '🏠' : n.degree}</small>}
          </button>
        ))}
      </div>

      <PianoKeyboard {...range} marks={marks} active={active} onPress={pressKey} />

      <div className="actions">
        <button disabled={!canReplay} onClick={() => play(sequence, false)}>
          🔁 ฟังทำนองอีกครั้ง
        </button>
        <button disabled={!canReplay} onClick={() => play(sequence, true)}>
          🎶 ฟังเพลงบอกบ้าน
        </button>
      </div>
      <p className="hint">⌨️ ปุ่มลัด: กด 1–7 แทนการแตะปุ่ม · Enter ฟังทำนองอีกครั้ง · ฟังซ้ำได้ไม่เสียหัวใจ</p>
    </div>
  )
}
