import { useEffect, useState } from 'react'
import { playNotes, stopAll } from '../audio/engine'
import { describePosition, fixedSolfege, LETTERS, type StaffNote } from '../notation/staff'
import { answerLetters, generateReadingQuestions, isCorrectLetter } from '../reading/logic'
import { keyboardRange } from '../theory/keys'
import { Confetti } from './Confetti'
import { Mascot, type MascotMood } from './Mascot'
import { PianoKeyboard, type KeyMark } from './PianoKeyboard'
import { Staff } from './Staff'

export interface ReadingConfig {
  notes: string[]
  colored: boolean
  count: number
}

export interface ReadingAnswer {
  question: StaffNote
  chosen: string
  correct: boolean
}

interface Props {
  config: ReadingConfig
  onDone: (answers: ReadingAnswer[]) => void
  onQuit: () => void
}

const PRAISE = ['ถูกต้อง!', 'อ่านเก่งมาก!', 'เยี่ยมเลย!', 'ตาไวจัง!', 'สุดยอด!']
const COMFORT = ['เกือบแล้ว!', 'ไม่เป็นไรนะ!', 'ลองดูใหม่นะ!']

function chip(n: StaffNote) {
  return (
    <b className={`chip deg-${n.letterIndex + 1}`}>
      {n.letter} · {fixedSolfege(n)}
    </b>
  )
}

export function ReadingPlay({ config, onDone, onQuit }: Props) {
  const [questions] = useState(() => generateReadingQuestions(config.notes, config.count))
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<ReadingAnswer[]>([])
  /** คีย์เปียโนที่เด็กกด (ถ้าตอบผ่านเปียโน) */
  const [pressedMidi, setPressedMidi] = useState<number | null>(null)
  const letters = answerLetters(config.notes)
  const question = questions[index]
  const last = answers[index]
  const answered = last !== undefined
  const score = answers.filter((a) => a.correct).length
  const range = keyboardRange(60, 72)

  useEffect(() => stopAll, [])

  const answer = (letter: string, midi: number | null = null) => {
    if (answered) return
    setPressedMidi(midi)
    setAnswers((prev) => [...prev, { question, chosen: letter, correct: isCorrectLetter(question, letter) }])
    // อ่านก่อน แล้วค่อยได้ยินเสียงของโน้ตที่อ่าน
    playNotes([question.midi], 1.2)
  }

  const next = () => {
    if (!answered) return
    setPressedMidi(null)
    if (index + 1 >= questions.length) onDone(answers)
    else setIndex(index + 1)
  }

  const pressKey = (midi: number) => {
    if (answered) {
      playNotes([midi], 1)
      return
    }
    const letter = ['C', null, 'D', null, 'E', 'F', null, 'G', null, 'A', null, 'B'][midi % 12]
    if (letter) answer(letter, midi)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const letter = e.key.toUpperCase()
      if ((LETTERS as readonly string[]).includes(letter) && letters.includes(letter)) answer(letter)
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        next()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // เปียโนไม่มีสีและไม่มีชื่อ (มีแค่ C เป็นจุดสังเกต) เพื่อให้เด็กอ่านจากบรรทัดจริงๆ
  const marks: Record<number, KeyMark> = { 60: { tone: 'scale', label: 'C' }, 72: { tone: 'scale', label: 'C' } }
  if (answered) {
    marks[question.midi] = { ...marks[question.midi], tone: 'correct' }
    if (!last.correct && pressedMidi !== null) marks[pressedMidi] = { ...marks[pressedMidi], tone: 'wrong' }
  }

  const where = describePosition(question.pos)
  const octaveHint = answered && last.correct && pressedMidi !== null && pressedMidi !== question.midi
  let mood: MascotMood = 'idle'
  let speech = <>โน้ตตัวนี้ชื่ออะไรเอ่ย? 🔍 ดูให้ดีว่าอยู่บนเส้นหรือในช่องนะ</>
  if (last?.correct) {
    mood = 'happy'
    speech = (
      <>
        <b>{PRAISE[index % PRAISE.length]}</b> นี่คือ {chip(question)} {where}
        {octaveHint && <> · ชื่อถูกแล้ว แต่ตัวจริงอยู่อีกออคเทฟนะ 🎹</>}
      </>
    )
  } else if (last) {
    mood = 'oops'
    speech = (
      <>
        <b>{COMFORT[index % COMFORT.length]}</b> นี่คือ {chip(question)} {where} ไม่ใช่ {last.chosen}
      </>
    )
  }

  return (
    <div className="card quiz">
      <div className="quiz-top">
        <span className="pill">🎼 อ่านโน้ต</span>
        <span className="pill">
          ข้อ {index + 1}/{questions.length}
        </span>
        <span className="pill">⭐ {score}</span>
        <button className="ghost small quit" onClick={onQuit}>
          ✕ ออก
        </button>
      </div>
      <div className="progress" aria-hidden>
        <div style={{ width: `${((index + (answered ? 1 : 0)) / questions.length) * 100}%` }} />
      </div>

      <div className="stage">
        {last?.correct && <Confetti key={index} />}
        <Mascot mood={mood}>{speech}</Mascot>
      </div>

      <div className="staff-box staff-single">
        <Staff
          colored={config.colored}
          spread={2.4}
          ariaLabel="โน้ตที่ต้องอ่าน"
          notes={[{ name: question.name, state: answered ? (last.correct ? 'correct' : 'wrong') : undefined }]}
        />
      </div>

      <div className="letter-pad">
        {letters.map((l) => {
          let state = ''
          if (answered) {
            if (l === question.letter) state = 'right'
            else if (l === last.chosen) state = 'wrong'
            else state = 'dim'
          }
          return (
            <button key={l} className={state} disabled={answered} onClick={() => answer(l)}>
              <span className="big">{l}</span>
              <small>{fixedSolfege({ letterIndex: LETTERS.indexOf(l as (typeof LETTERS)[number]) })}</small>
            </button>
          )
        })}
      </div>

      <PianoKeyboard {...range} marks={marks} onPress={pressKey} />

      <div className="actions">
        {answered && <button onClick={() => playNotes([question.midi], 1.2)}>🔊 ฟังเสียงโน้ตนี้</button>}
        {answered && (
          <button className="primary" onClick={next}>
            {index + 1 < questions.length ? 'ข้อต่อไป ➜' : 'ดูผลลัพธ์ 🏆'}
          </button>
        )}
      </div>
      <p className="hint">⌨️ ปุ่มลัด: กดตัวอักษร C D E F G A B เพื่อตอบ · Enter ข้อต่อไป · ตอบได้ทั้งปุ่มและคีย์เปียโน</p>
    </div>
  )
}
