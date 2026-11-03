import { useEffect, useState } from 'react'
import { stopAll } from '../audio/engine'
import { playRhythm, stopRhythm } from '../audio/rhythm'
import { useCountdown } from '../lib/useCountdown'
import { generateRhythmQuestions, PENDING_TICK, type BeatTick } from '../rhythm/logic'
import { RHYTHMS, type RhythmValue } from '../rhythm/values'
import { BeatDots } from './BeatDots'
import { Confetti } from './Confetti'
import { GameTopActions } from './GameTopActions'
import { Mascot, type MascotMood } from './Mascot'
import { RhythmGlyph } from './RhythmGlyph'
import { TimerBar } from './TimerControls'

export interface RhythmConfig {
  values: RhythmValue[]
  /** ชื่อด่าน */
  level: string
  /** เคาะจังหวะต่อระหว่างโน้ตดัง */
  clicks: boolean
  count: number
  /** เวลาตอบต่อข้อ (วินาที) 0 = ไม่จับเวลา */
  timeLimit: number
}

export interface RhythmAnswer {
  question: RhythmValue
  /** ตัวที่เลือก หรือ null ถ้าหมดเวลา */
  chosen: RhythmValue | null
  correct: boolean
}

interface Props {
  config: RhythmConfig
  onDone: (answers: RhythmAnswer[]) => void
  onRestart: () => void
  onQuit: () => void
}

const PRAISE = ['เก่งมาก!', 'นับจังหวะแม่นจัง!', 'สุดยอด!', 'หูไวมาก!', 'เยี่ยมเลย!']
const COMFORT = ['เกือบแล้ว!', 'ไม่เป็นไรนะ!', 'ลองดูใหม่นะ!']

function chip(value: RhythmValue) {
  const info = RHYTHMS[value]
  return (
    <b className={`chip ${info.color}`}>
      {info.name} ({info.beatsLabel})
    </b>
  )
}

export function RhythmPlay({ config, onDone, onRestart, onQuit }: Props) {
  const [questions] = useState(() => generateRhythmQuestions(config.values, config.count))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<RhythmAnswer[]>([])
  /** 'listen' = กำลังเล่นเสียงคำถาม (ยังตอบไม่ได้) · 'turn' = ตอบได้ */
  const [phase, setPhase] = useState<'listen' | 'turn'>('listen')
  const [tick, setTick] = useState<BeatTick | null>(null)
  /** ตัวที่กำลังระบายวงกลมให้ดู (หลังตอบแล้ว) */
  const [fill, setFill] = useState<RhythmValue | null>(null)
  const question = questions[index]
  const last = answers[index]
  const answered = last !== undefined
  const score = answers.filter((a) => a.correct).length

  const play = async (value: RhythmValue, showFill: boolean) => {
    setFill(showFill ? value : null)
    setTick(PENDING_TICK)
    if (!answered) setPhase('listen')
    const finished = await playRhythm({ value, clicks: config.clicks }, { onBeat: setTick })
    if (finished) {
      setTick(null)
      setPhase('turn')
    }
  }

  // ขึ้นข้อใหม่: เล่นเสียงคำถาม (ไม่เฉลยความยาวให้เห็น)
  useEffect(() => {
    setFill(null)
    void play(question, false)
    return stopAll
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  const answer = (chosen: RhythmValue | null) => {
    if (answered) return
    stopRhythm()
    setAnswers((prev) => [...prev, { question, chosen, correct: chosen === question }])
    // เล่นคำตอบที่ถูกให้ฟังอีกครั้ง พร้อมระบายวงกลมให้เห็นว่ายาวกี่จังหวะ
    void play(question, true)
  }

  const remaining = useCountdown({
    seconds: config.timeLimit,
    running: phase === 'turn' && !answered,
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
      const n = Number(e.key)
      if (n >= 1 && n <= config.values.length && phase === 'turn') answer(config.values[n - 1])
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (answered) next()
        else if (phase === 'turn') void play(question, false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const counting = tick?.phase === 'count'
  const timedOut = answered && last.chosen === null
  let mood: MascotMood = phase === 'listen' ? 'listen' : 'idle'
  let speech = counting ? (
    tick.beat < 0 ? <>เตรียมตัวนะ… 👂</> : <>นับตามนะ… {tick.beat + 1} 👂</>
  ) : phase === 'listen' ? (
    <>ฟังให้ดีว่าเสียงยาวกี่จังหวะ… 🎵</>
  ) : (
    <>เสียงนั้นยาวกี่จังหวะ? เป็นโน้ตตัวไหนเอ่ย? 🤔</>
  )
  if (last?.correct) {
    mood = 'happy'
    speech = (
      <>
        <b>{PRAISE[index % PRAISE.length]}</b> นั่นคือ {chip(question)} “{RHYTHMS[question].syllable}”
      </>
    )
  } else if (last) {
    mood = 'oops'
    speech = (
      <>
        <b>{timedOut ? '⏰ หมดเวลา! ไม่เป็นไรนะ' : COMFORT[index % COMFORT.length]}</b> นั่นคือ {chip(question)}
        {last.chosen && <> ไม่ใช่ {chip(last.chosen)}</>} · ดูวงกลมว่าเสียงยาวไปถึงไหนนะ
      </>
    )
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="pill">🥁 ทายจังหวะ</span>
        <span className="pill">
          ข้อ {index + 1}/{questions.length}
        </span>
        <span className="pill">⭐ {score}</span>
        <GameTopActions onRestart={onRestart} onQuit={onQuit} />
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>
      {config.timeLimit > 0 && (
        <TimerBar remainingMs={remaining} seconds={config.timeLimit} paused={phase === 'listen' && !answered} />
      )}

      <div className="stage">
        {last?.correct && <Confetti key={index} />}
        <Mascot mood={mood}>{speech}</Mascot>
      </div>

      <div className="rhythm-stage">
        {answered ? (
          <RhythmGlyph value={question} className={`big ${RHYTHMS[question].color}`} />
        ) : (
          <span className="stage-hint">❓</span>
        )}
        <BeatDots tick={tick} fill={fill} />
      </div>

      <div className="rhythm-answers">
        {config.values.map((value, i) => {
          const info = RHYTHMS[value]
          let state = ''
          if (answered) {
            if (value === question) state = ' right'
            else if (value === last.chosen) state = ' wrong'
            else state = ' dim'
          }
          return (
            <button
              key={value}
              className={`rhythm-card ${info.color}${state}`}
              disabled={answered || phase !== 'turn'}
              onClick={() => answer(value)}
            >
              <RhythmGlyph value={value} />
              <span className="rc-name">{info.name}</span>
              <span className="rc-beats">{info.beatsLabel}</span>
              <kbd>{i + 1}</kbd>
              {state === ' right' && <span className="mark">✓</span>}
              {state === ' wrong' && <span className="mark">✗</span>}
            </button>
          )
        })}
      </div>

      <div className="actions">
        {!answered && (
          <button disabled={phase !== 'turn'} onClick={() => play(question, false)}>
            🔁 ฟังอีกครั้ง
          </button>
        )}
        {answered && <button onClick={() => play(question, true)}>🔊 ฟังตัวที่ถูก</button>}
        {answered && last.chosen && !last.correct && (
          <button onClick={() => play(last.chosen!, true)}>🔊 ฟังตัวที่เลือก</button>
        )}
        {answered && (
          <button className="primary" onClick={next}>
            {index + 1 < questions.length ? 'ข้อต่อไป ➜' : 'ดูผลลัพธ์ 🏆'}
          </button>
        )}
      </div>
      <p className="hint">⌨️ ปุ่มลัด: กด 1–{config.values.length} เพื่อตอบ · Enter ฟังซ้ำ/ข้อต่อไป</p>
    </div>
  )
}
