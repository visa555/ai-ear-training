import { useState } from 'react'
import { ensureAudio } from '../audio/engine'
import { Mascot } from '../components/Mascot'
import { RhythmGlyph } from '../components/RhythmGlyph'
import { RhythmPlay, type RhythmAnswer, type RhythmConfig } from '../components/RhythmPlay'
import { TimerSelect } from '../components/TimerControls'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { starsFor } from '../quiz/generator'
import { RHYTHM_LEVELS } from '../rhythm/logic'
import { RHYTHM_ORDER, RHYTHMS } from '../rhythm/values'

type Stage =
  | { name: 'setup' }
  | { name: 'play'; config: RhythmConfig; round: number }
  | { name: 'done'; config: RhythmConfig; answers: RhythmAnswer[] }

const COUNT = 10

export function RhythmPage() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [clicks, setClicks] = useState(true)
  const [timeLimit, setTimeLimit] = useState(0)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>({ name: 'setup' })

  const begin = (config: RhythmConfig) => setStage({ name: 'play', config, round: Date.now() })

  const start = async () => {
    setLoading(true)
    await ensureAudio()
    setLoading(false)
    const level = RHYTHM_LEVELS[levelIndex]
    begin({ values: level.values, level: level.name, clicks, timeLimit, count: COUNT })
  }

  if (stage.name === 'play') {
    return (
      <RhythmPlay
        key={stage.round}
        config={stage.config}
        onRestart={() => begin(stage.config)}
        onQuit={() => setStage({ name: 'setup' })}
        onDone={(answers) => setStage({ name: 'done', config: stage.config, answers })}
      />
    )
  }

  if (stage.name === 'done') {
    const { answers, config } = stage
    const correct = answers.filter((a) => a.correct).length
    const stars = starsFor(Math.round((correct / answers.length) * 100))
    const timeouts = answers.filter((a) => a.chosen === null).length
    const byValue = RHYTHM_ORDER.map((value) => {
      const asked = answers.filter((a) => a.question === value)
      return { value, total: asked.length, correct: asked.filter((a) => a.correct).length }
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
          ทายถูก <b>{correct}</b> จาก {answers.length} ข้อ
        </p>
        {timeouts > 0 && <p className="muted center">⏰ หมดเวลา {timeouts} ข้อ</p>}
        <Mascot mood={stars === 2 ? 'happy' : 'cheer'}>
          {stars === 3
            ? config.clicks
              ? 'นับจังหวะเก่งมาก! ลองปิด “เคาะจังหวะระหว่างโน้ตดัง” ดูไหม จะได้นับในใจเอง 🥁'
              : 'สุดยอด! นับจังหวะในใจได้แม่นแล้ว ลองด่านที่ยากขึ้นดูนะ 🦅'
            : stars === 2
              ? 'เก่งมาก! อีกนิดเดียวก็ได้ 3 ดาวแล้ว ✨'
              : 'เก่งที่เล่นจนจบ! ลองไปฟังบทเรียนจังหวะในเมนู “อ่านโน้ต” แล้วกลับมาเล่นใหม่นะ 💪'}
        </Mascot>

        <h3>โน้ตแต่ละตัวเป็นยังไงบ้าง</h3>
        <table className="stats">
          <tbody>
            {byValue.map((s) => {
              const p = Math.round((s.correct / s.total) * 100)
              const info = RHYTHMS[s.value]
              return (
                <tr key={s.value}>
                  <th>
                    <span className={`chip ${info.color}`}>{info.name}</span>
                  </th>
                  <td className="bar-cell">
                    <div className="bar">
                      <div style={{ width: `${Math.max(p, 4)}%` }} className={info.color} />
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
        มาเล่น<b>ทายจังหวะโน้ต</b>กัน! ฉันจะเคาะนับ 1 2 3 4 ก่อน แล้วเล่นเสียงโน้ต หนูทายว่าเป็นโน้ตตัวไหน ยาวกี่จังหวะนะ 🥁
        ถ้ายังไม่รู้จักตัวโน้ต ไปดูบทเรียนในเมนู “อ่านโน้ต” ก่อนได้
      </Mascot>

      <div className="card">
        <h2>1️⃣ เลือกด่าน</h2>
        <div className="levels five">
          {RHYTHM_LEVELS.map((level, i) => (
            <button
              key={level.name}
              className={`level${i === levelIndex ? ' selected' : ''}`}
              onClick={() => setLevelIndex(i)}
            >
              <span className="level-icon">{level.icon}</span>
              <span className="level-name">{level.name}</span>
              <span className="level-glyphs">
                {level.values.map((v) => (
                  <RhythmGlyph key={v} value={v} className={RHYTHMS[v].color} />
                ))}
              </span>
              <small>{level.values.map((v) => RHYTHMS[v].name).join(' · ')}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <ToggleSwitch checked={clicks} onChange={setClicks}>
          🥢 <b>เคาะจังหวะระหว่างโน้ตดัง</b> (โหมดง่าย)
          <small>ปิดไว้ถ้าอยากฝึกนับจังหวะในใจเอง</small>
        </ToggleSwitch>
        <TimerSelect value={timeLimit} onChange={setTimeLimit} unit="ต่อข้อ" />
        <p className="hint left">เริ่มนับเวลาหลังเสียงเล่นจบ</p>
      </div>

      <div className="start-row">
        <button className="primary huge" disabled={loading} onClick={start}>
          {loading ? '🎹 กำลังเตรียมเสียง…' : '▶ เริ่มเล่นเลย!'}
        </button>
      </div>
    </>
  )
}
