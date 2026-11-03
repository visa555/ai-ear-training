import { useState } from 'react'
import { ensureGuitar } from '../audio/guitar'
import { GuitarPlay, type GuitarAnswer, type GuitarConfig } from '../components/GuitarPlay'
import { Mascot } from '../components/Mascot'
import { TimerSelect } from '../components/TimerControls'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { GUITAR_LEVELS, positionId, type FretNote } from '../guitar/fretboard'
import { LETTERS } from '../notation/staff'
import { degreeWeight, starsFor } from '../quiz/generator'
import { loadGuitarProgress, recordGuitarSession, type GuitarMode } from '../storage/guitarProgress'

const MODES: { value: GuitarMode; icon: string; label: string; desc: string }[] = [
  { value: 'find', icon: '🎯', label: 'หาโน้ตบนคอ', desc: 'บอกชื่อโน้ต แล้วหาช่อง' },
  { value: 'name', icon: '🔤', label: 'ช่องนี้ชื่ออะไร', desc: 'ชี้ช่องให้ แล้วบอกชื่อ' },
  { value: 'listen', icon: '👂', label: 'ฟังแล้วหาบนคอ', desc: 'ฟังเสียง แล้วหาช่องให้ถูก' },
]

type Stage =
  | { name: 'setup' }
  | { name: 'play'; config: GuitarConfig; round: number; weight?: (note: FretNote) => number }
  | { name: 'done'; config: GuitarConfig; answers: GuitarAnswer[] }

const COUNT = 10

export function GuitarPage() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [mode, setMode] = useState<GuitarMode>('find')
  const [labels, setLabels] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [timeLimit, setTimeLimit] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>({ name: 'setup' })

  /** ใช้สถิติสะสม: ช่องที่เคยตอบผิดบ่อยได้น้ำหนักมาก (สูตรเดียวกับเกมอื่น) */
  const begin = (config: GuitarConfig, useStats = adaptive) => {
    const byPosition = useStats ? loadGuitarProgress().byPosition : null
    const weight = byPosition ? (note: FretNote) => degreeWeight(byPosition[positionId(note)]) : undefined
    setStage({ name: 'play', config, round: Date.now(), weight })
  }

  const start = async () => {
    setLoading(true)
    await ensureGuitar()
    setLoading(false)
    begin({ level: GUITAR_LEVELS[levelIndex], mode, count: COUNT, timeLimit, labels })
  }

  if (stage.name === 'play') {
    return (
      <GuitarPlay
        key={stage.round}
        config={stage.config}
        weight={stage.weight}
        onRestart={() => begin(stage.config)}
        onQuit={() => setStage({ name: 'setup' })}
        onDone={(answers) => {
          recordGuitarSession(
            stage.config.level.name,
            stage.config.mode,
            answers.map((a) => ({ position: positionId(a.question), correct: a.correct })),
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
    const timeouts = answers.filter((a) => a.chosen === null).length
    const byNote = LETTERS.map((pc, i) => {
      const asked = answers.filter((a) => a.question.pc === pc)
      return { pc, letterIndex: i, total: asked.length, correct: asked.filter((a) => a.correct).length }
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
          หาถูก <b>{correct}</b> จาก {answers.length} ข้อ
        </p>
        {timeouts > 0 && <p className="muted center">⏰ หมดเวลา {timeouts} ข้อ</p>}
        <Mascot mood={stars === 2 ? 'happy' : 'cheer'}>
          {stars === 3
            ? config.mode === 'find' && config.labels
              ? 'จำคอกีตาร์เก่งมาก! ลองปิด “โชว์ชื่อโน้ตบนคอ” ดูไหม จะได้จำเองจริงๆ 🎸'
              : 'สุดยอด! จำได้เองโดยไม่ต้องดูชื่อโน้ตแล้ว ลองด่านที่ยากขึ้นนะ 🦅'
            : stars === 2
              ? 'เก่งมาก! อีกนิดเดียวก็ได้ 3 ดาวแล้ว ✨'
              : 'เก่งที่เล่นจนจบ! ลองไปดูบทเรียนคอกีตาร์ในเมนู “รู้จักโน้ต” แล้วกลับมาเล่นใหม่นะ 💪'}
        </Mascot>

        <h3>โน้ตแต่ละตัวเป็นยังไงบ้าง</h3>
        <table className="stats">
          <tbody>
            {byNote.map((s) => {
              const p = Math.round((s.correct / s.total) * 100)
              return (
                <tr key={s.pc}>
                  <th>
                    <span className={`chip deg-${s.letterIndex + 1}`}>{s.pc}</span>
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

  return (
    <>
      <Mascot mood="cheer">
มาฝึก<b>จำโน้ตบนคอกีตาร์</b>กัน! 🎸 เลือกได้ว่าจะให้ฉันบอกชื่อโน้ตแล้วหนูหาช่อง หรือฉันชี้ช่องแล้วหนูบอกชื่อ
        ถ้ายังไม่ชินกับคอกีตาร์ ไปดูบทเรียนในเมนู “รู้จักโน้ต” ก่อนได้
      </Mascot>

      <div className="card">
        <h2>1️⃣ เลือกแบบเล่น</h2>
        <div className="mode-cards">
          {MODES.map((m) => (
            <button key={m.value} className={`level${m.value === mode ? ' selected' : ''}`} onClick={() => setMode(m.value)}>
              <span className="level-icon">{m.icon}</span>
              <span className="level-name">{m.label}</span>
              <small>{m.desc}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>2️⃣ เลือกด่าน</h2>
        <div className="levels five">
          {GUITAR_LEVELS.map((level, i) => (
            <button
              key={level.name}
              className={`level${i === levelIndex ? ' selected' : ''}`}
              onClick={() => setLevelIndex(i)}
            >
              <span className="level-icon">{level.icon}</span>
              <span className="level-name">{level.name}</span>
              <small>{level.hint}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <ToggleSwitch checked={labels} onChange={setLabels}>
          🏷️ <b>โชว์ชื่อโน้ตบนคอ</b> (ล้อช่วย)
          <small>โชว์โน้ตตัวอื่นบนสายที่ถาม ให้นับหาคำตอบได้ · ปิดเมื่อพร้อมจำเอง</small>
        </ToggleSwitch>
        <ToggleSwitch checked={adaptive} onChange={setAdaptive}>
          🎯 <b>เน้นช่องที่เคยตอบผิดบ่อย</b>
          <small>ใช้ผลที่บันทึกไว้ ให้ช่องที่ยังไม่แม่นออกบ่อยขึ้น</small>
        </ToggleSwitch>
        <TimerSelect value={timeLimit} onChange={setTimeLimit} unit="ต่อข้อ" />
      </div>

      <div className="start-row">
        <button className="primary huge" disabled={loading} onClick={start}>
          {loading ? '🎸 กำลังเตรียมเสียงกีตาร์…' : '▶ เริ่มเล่นเลย!'}
        </button>
      </div>
    </>
  )
}
