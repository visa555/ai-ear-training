import { useState } from 'react'
import { KID_TIPS, randomTipIndex } from '../content/tips'
import type { QuizConfig } from '../quiz/generator'
import { DEGREES, scaleNotes, type KeyDef, type LabelMode } from '../theory/keys'
import { KeySelector } from './KeySelector'
import { LabelModeToggle } from './LabelModeToggle'
import { Mascot } from './Mascot'

const LEVELS: { icon: string; name: string; degrees: number[] }[] = [
  { icon: '🐣', name: 'ระดับ 1', degrees: [1, 3, 5] },
  { icon: '🐥', name: 'ระดับ 2', degrees: [1, 2, 3, 4, 5] },
  { icon: '🦅', name: 'ระดับ 3', degrees: [...DEGREES] },
]

const COUNTS = [5, 10, 20]

interface Props {
  keyDef: KeyDef
  onKeyChange: (key: KeyDef) => void
  labelMode: LabelMode
  onLabelModeChange: (mode: LabelMode) => void
  onStart: (config: QuizConfig) => void
  loading: boolean
}

export function QuizSetup({ keyDef, onKeyChange, labelMode, onLabelModeChange, onStart, loading }: Props) {
  const [degrees, setDegrees] = useState<number[]>([1, 3, 5])
  const [octaves, setOctaves] = useState<1 | 2>(1)
  const [count, setCount] = useState(10)
  const [cadenceEvery, setCadenceEvery] = useState(true)
  const [adaptive, setAdaptive] = useState(true)
  const [tipIndex, setTipIndex] = useState(() => randomTipIndex())
  const notes = scaleNotes(keyDef)
  const tip = KID_TIPS[tipIndex]

  const toggleDegree = (d: number) =>
    setDegrees((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)))

  return (
    <>
      <Mascot mood="cheer">
        มาเล่น<b>เกมทายโน้ต</b>กัน! ฉันจะเล่น “เพลงบอกบ้าน” ให้ฟังก่อน แล้วซ่อนโน้ตไว้หนึ่งตัว ทายให้ถูกนะว่าเป็นตัวไหน 🎯
        <span className="tip-line">
          💡 <b>เคล็ดลับ:</b> {tip.short}{' '}
          <button className="ghost small" onClick={() => setTipIndex((i) => randomTipIndex(i))}>
            🔄 อีกข้อ
          </button>
        </span>
      </Mascot>

      <div className="card">
        <h2>1️⃣ เลือกด่าน</h2>
        <div className="levels">
          {LEVELS.map((level) => (
            <button
              key={level.name}
              className={`level${level.degrees.join() === degrees.join() ? ' selected' : ''}`}
              onClick={() => setDegrees(level.degrees)}
            >
              <span className="level-icon">{level.icon}</span>
              <span className="level-name">{level.name}</span>
              <span className="level-notes">
                {level.degrees.map((d) => (
                  <i key={d} className={`dot deg-${d}`} title={notes[d - 1].solfege} />
                ))}
              </span>
              <small>{level.degrees.map((d) => notes[d - 1].solfege).join(' ')}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>2️⃣ เลือกคีย์</h2>
        <KeySelector value={keyDef} onChange={onKeyChange} />
      </div>

      <details className="card more">
        <summary>⚙️ ตั้งค่าเพิ่มเติม (สำหรับคุณครูและผู้ปกครอง)</summary>

        <fieldset>
          <legend>เลือกโน้ตที่จะสุ่มเอง</legend>
          <div className="degree-toggles">
            {DEGREES.map((d) => (
              <label key={d} className={`deg-${d}${degrees.includes(d) ? ' on' : ''}`}>
                <input type="checkbox" checked={degrees.includes(d)} onChange={() => toggleDegree(d)} />
                <span>{notes[d - 1].solfege}</span>
                <small>ตัวที่ {d}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="setup-row">
          <fieldset>
            <legend>ช่วงเสียง</legend>
            <div className="segmented">
              {([1, 2] as const).map((o) => (
                <button key={o} className={octaves === o ? 'selected' : ''} onClick={() => setOctaves(o)}>
                  {o} ออคเทฟ
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>จำนวนข้อ</legend>
            <div className="segmented">
              {COUNTS.map((c) => (
                <button key={c} className={count === c ? 'selected' : ''} onClick={() => setCount(c)}>
                  {c} ข้อ
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        <fieldset>
          <legend>ปุ่มคำตอบแสดงเป็น</legend>
          <LabelModeToggle value={labelMode} onChange={onLabelModeChange} />
        </fieldset>

        <label className="switch">
          <input type="checkbox" checked={cadenceEvery} onChange={(e) => setCadenceEvery(e.target.checked)} />
          เล่นเพลงบอกบ้าน (cadence) ก่อนทุกข้อ · ถ้าปิดจะเล่นแค่ข้อแรก
        </label>

        <label className="switch">
          <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} />
          ให้โน้ตที่เคยตอบผิดบ่อยออกบ่อยขึ้น (ใช้สถิติที่บันทึกไว้ของคีย์นี้)
        </label>
      </details>

      {degrees.length < 2 && <p className="warn">เลือกโน้ตอย่างน้อย 2 ตัวนะ</p>}
      <div className="start-row">
        <button
          className="primary huge"
          disabled={degrees.length < 2 || loading}
          onClick={() => onStart({ key: keyDef, degrees, octaves, count, labelMode, cadenceEvery, adaptive })}
        >
          {loading ? '🎹 กำลังเตรียมเปียโน…' : '▶ เริ่มเล่นเลย!'}
        </button>
      </div>
    </>
  )
}
