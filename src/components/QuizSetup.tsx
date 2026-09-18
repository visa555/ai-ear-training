import { useState } from 'react'
import type { QuizConfig } from '../quiz/generator'
import { DEGREES, isMinor, scaleNotes, type KeyDef, type LabelMode } from '../theory/keys'
import { KeySelector } from './KeySelector'
import { LabelModeToggle } from './LabelModeToggle'

const PRESETS: { label: string; degrees: number[] }[] = [
  { label: 'ง่าย: 1 3 5', degrees: [1, 3, 5] },
  { label: 'กลาง: 1 2 3 4 5', degrees: [1, 2, 3, 4, 5] },
  { label: 'ครบ 7 ขั้น', degrees: [...DEGREES] },
]

const COUNTS = [10, 20, 30]

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
  const notes = scaleNotes(keyDef)

  const toggleDegree = (d: number) =>
    setDegrees((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d].sort((a, b) => a - b)))

  return (
    <div className="card">
      <h2>ตั้งค่าแบบทดสอบ</h2>
      <p className="muted">
        แอปจะเล่น cadence {isMinor(keyDef.mode) ? 'i–iv–V–i' : 'I–IV–V–I'} เพื่อบอกคีย์ก่อน แล้วสุ่มเล่นโน๊ตหนึ่งตัว ให้คุณตอบว่าเป็นขั้นที่เท่าไรของสเกล
      </p>

      <fieldset>
        <legend>คีย์</legend>
        <KeySelector value={keyDef} onChange={onKeyChange} />
      </fieldset>

      <fieldset>
        <legend>ขั้นที่จะสุ่ม</legend>
        <div className="chips">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              className={p.degrees.join() === degrees.join() ? 'selected' : ''}
              onClick={() => setDegrees(p.degrees)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="degree-toggles">
          {DEGREES.map((d) => (
            <label key={d} className={degrees.includes(d) ? 'on' : ''}>
              <input type="checkbox" checked={degrees.includes(d)} onChange={() => toggleDegree(d)} />
              <span>{d}</span>
              <small>{notes[d - 1].solfege}</small>
            </label>
          ))}
        </div>
        {degrees.length < 2 && <p className="warn">เลือกอย่างน้อย 2 ขั้น</p>}
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
                {c}
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
        เล่น cadence ก่อนทุกข้อ (ถ้าปิด จะเล่นแค่ข้อแรก)
      </label>

      <label className="switch">
        <input type="checkbox" checked={adaptive} onChange={(e) => setAdaptive(e.target.checked)} />
        เน้นขั้นที่เคยตอบผิดบ่อย (ใช้สถิติสะสมของคีย์นี้)
      </label>

      <div className="actions">
        <button
          className="primary large"
          disabled={degrees.length < 2 || loading}
          onClick={() => onStart({ key: keyDef, degrees, octaves, count, labelMode, cadenceEvery, adaptive })}
        >
          {loading ? 'กำลังโหลดเสียงเปียโน…' : 'เริ่มแบบทดสอบ'}
        </button>
      </div>
    </div>
  )
}
