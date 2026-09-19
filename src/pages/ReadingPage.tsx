import { useState } from 'react'
import { ensureAudio } from '../audio/engine'
import { Mascot } from '../components/Mascot'
import { ReadingPlay, type ReadingAnswer, type ReadingConfig } from '../components/ReadingPlay'
import { Staff } from '../components/Staff'
import { TimerSelect } from '../components/TimerControls'
import { fixedSolfege, LETTERS, staffNote, type StaffNote } from '../notation/staff'
import { degreeWeight, starsFor } from '../quiz/generator'
import { READING_LEVELS } from '../reading/logic'
import { loadReadingProgress, recordReadingSession } from '../storage/readingProgress'

type Stage =
  | { name: 'setup' }
  | { name: 'play'; config: ReadingConfig; round: number; weight?: (note: StaffNote) => number }
  | { name: 'done'; config: ReadingConfig; answers: ReadingAnswer[] }

const COUNT = 10

export function ReadingPage() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [colored, setColored] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [timeLimit, setTimeLimit] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>({ name: 'setup' })

  /** ใช้สถิติสะสม: โน้ตที่อ่านพลาดบ่อยได้น้ำหนักมาก (สูตรเดียวกับเกมทายโน้ต) */
  const begin = (config: ReadingConfig) => {
    const byNote = config.adaptive ? loadReadingProgress().byNote : null
    const weight = byNote ? (note: StaffNote) => degreeWeight(byNote[note.name]) : undefined
    setStage({ name: 'play', config, round: Date.now(), weight })
  }

  const start = async () => {
    setLoading(true)
    await ensureAudio()
    setLoading(false)
    const level = READING_LEVELS[levelIndex]
    begin({ notes: level.notes, level: level.name, colored, adaptive, count: COUNT, timeLimit })
  }

  if (stage.name === 'play') {
    return (
      <ReadingPlay
        key={stage.round}
        config={stage.config}
        weight={stage.weight}
        onRestart={() => begin(stage.config)}
        onQuit={() => setStage({ name: 'setup' })}
        onDone={(answers) => {
          recordReadingSession(
            stage.config.level,
            answers.map((a) => ({ note: a.question.name, correct: a.correct })),
          )
          setStage({ name: 'done', config: stage.config, answers })
        }}
      />
    )
  }

  if (stage.name === 'done') {
    const { answers, config } = stage
    const correct = answers.filter((a) => a.correct).length
    const stars = starsFor(Math.round((correct / answers.length) * 100))
    const timeouts = answers.filter((a) => a.chosen === '').length
    const byLetter = LETTERS.map((letter, i) => {
      const asked = answers.filter((a) => a.question.letter === letter)
      return { letter, letterIndex: i, total: asked.length, correct: asked.filter((a) => a.correct).length }
    }).filter((s) => s.total > 0)

    return (
      <div className="card summary">
        <div className="stars" aria-label={`ได้ ${stars} ดาว จาก 3 ดาว`}>
          {[1, 2, 3].map((s) => (
            <span key={s} className={s <= stars ? 'star on' : 'star'} style={{ animationDelay: `${s * 0.2}s` }}>
              ★
            </span>
          ))}
        </div>
        <p className="summary-score">
          อ่านถูก <b>{correct}</b> จาก {answers.length} ตัว
        </p>
        {timeouts > 0 && <p className="muted center">⏰ หมดเวลา {timeouts} ตัว</p>}
        <Mascot mood={stars === 2 ? 'happy' : 'cheer'}>
          {stars === 3
            ? config.colored
              ? 'อ่านเก่งมาก! ลองปิด “หัวโน้ตสี” ดูไหม จะได้ฝึกอ่านแบบโน้ตจริง 🎼'
              : 'สุดยอด! อ่านโน้ตสีดำได้แล้ว ลองด่านที่ยากขึ้นดูนะ 🦅'
            : stars === 2
              ? 'เก่งมาก! อีกนิดเดียวก็ได้ 3 ดาวแล้ว ✨'
              : 'เก่งที่เล่นจนจบ! ลองไปดูบทเรียนในเมนู “อ่านโน้ต” แล้วกลับมาเล่นใหม่นะ 💪'}
        </Mascot>

        <h3>โน้ตแต่ละตัวเป็นยังไงบ้าง</h3>
        <table className="stats">
          <tbody>
            {byLetter.map((s) => {
              const p = Math.round((s.correct / s.total) * 100)
              return (
                <tr key={s.letter}>
                  <th>
                    <span className={`chip deg-${s.letterIndex + 1}`}>
                      {s.letter} {fixedSolfege(s)}
                    </span>
                  </th>
                  <td className="bar-cell">
                    <div className="bar">
                      <div style={{ width: `${Math.max(p, 4)}%` }} className={`deg-${s.letterIndex + 1}`} />
                    </div>
                  </td>
                  <td className="num">
                    {s.correct}/{s.total} {p === 100 ? '🌟' : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="actions center">
          <button className="primary" onClick={() => begin(config)}>
            🔁 เล่นอีกรอบ
          </button>
          <button onClick={() => setStage({ name: 'setup' })}>🎯 เปลี่ยนด่าน</button>
        </div>
      </div>
    )
  }

  const level = READING_LEVELS[levelIndex]

  return (
    <>
      <Mascot mood="cheer">
        มาเล่น<b>พาโน้ตกลับบ้าน</b>กัน! ฉันจะวางโน้ตไว้บนบรรทัด 5 เส้น หนูบอกชื่อโน้ตให้ถูกนะ แล้วฉันจะเล่นเสียงให้ฟัง 🎼
      </Mascot>

      <div className="card">
        <h2>1️⃣ เลือกด่าน</h2>
        <div className="levels four">
          {READING_LEVELS.map((l, i) => (
            <button key={l.name} className={`level${i === levelIndex ? ' selected' : ''}`} onClick={() => setLevelIndex(i)}>
              <span className="level-icon">{l.icon}</span>
              <span className="level-name">{l.name}</span>
              <span className="level-notes">
                {l.notes.map((n) => (
                  <i key={n} className={`dot deg-${staffNote(n).letterIndex + 1}`} title={n} />
                ))}
              </span>
              <small>{l.hint}</small>
            </button>
          ))}
        </div>
        <div className="staff-box">
          <Staff
            colored={colored}
            spread={level.notes.length > 10 ? 0.65 : 0.8}
            ariaLabel={`โน้ตในด่าน ${level.name}`}
            notes={level.notes.map((n) => ({ name: n, label: staffNote(n).letter }))}
          />
        </div>
      </div>

      <div className="card">
        <label className="switch">
          <input type="checkbox" checked={colored} onChange={(e) => setColored(e.target.checked)} />
          <span>
            🎨 <b>หัวโน้ตสี</b> (ล้อช่วย) · ปิดเมื่อพร้อมอ่านโน้ตสีดำแบบของจริง
          </span>
        </label>
        <label className="switch">
          <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} />
          <span>
            🎯 <b>เน้นโน้ตที่อ่านพลาดบ่อย</b> · ใช้ผลที่บันทึกไว้ ให้ตัวที่ยังไม่แม่นออกบ่อยขึ้น
          </span>
        </label>
        <TimerSelect value={timeLimit} onChange={setTimeLimit} unit="ต่อข้อ" />
        {levelIndex === 3 && (
          <p className="hint">🚀 ด่านนี้มีโน้ตเส้นน้อย ลองดูบทเรียน “เส้นน้อย” ในเมนูอ่านโน้ตก่อนเล่นนะ</p>
        )}
      </div>

      <div className="start-row">
        <button className="primary huge" disabled={loading} onClick={start}>
          {loading ? '🎹 กำลังเตรียมเปียโน…' : '▶ เริ่มเล่นเลย!'}
        </button>
      </div>
    </>
  )
}
