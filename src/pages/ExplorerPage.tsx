import { useEffect, useState } from 'react'
import { cadenceSteps, tonicChord } from '../audio/cadence'
import { ensureAudio, playNotes, playSequence, stopAll, type Step } from '../audio/engine'
import { KeySelector } from '../components/KeySelector'
import { LabelModeToggle } from '../components/LabelModeToggle'
import { Mascot } from '../components/Mascot'
import { PianoKeyboard, type KeyMark } from '../components/PianoKeyboard'
import { StaffLesson } from '../components/StaffLesson'
import {
  isMinor,
  keyboardRange,
  keyInfo,
  keyName,
  noteLabel,
  prettyNote,
  scaleWithTopTonic,
  signatureText,
  tonicMidi,
  type KeyDef,
  type LabelMode,
  type ScaleNote,
} from '../theory/keys'

interface Props {
  keyDef: KeyDef
  onKeyChange: (key: KeyDef) => void
  labelMode: LabelMode
  onLabelModeChange: (mode: LabelMode) => void
}

type View = 'piano' | 'staff'

export function ExplorerPage({ keyDef, onKeyChange, labelMode, onLabelModeChange }: Props) {
  const [view, setView] = useState<View>('piano')
  const [active, setActive] = useState<number[]>([])
  const info = keyInfo(keyDef)
  const scale = scaleWithTopTonic(keyDef)
  const root = tonicMidi(keyDef)
  const minor = isMinor(keyDef.mode)
  const range = keyboardRange(root, root + 12)
  // เมโลดิกไมเนอร์แบบดั้งเดิม: ขาลงกลับไปใช้ natural minor
  const descending = scaleWithTopTonic(keyDef.mode === 'melodic' ? { ...keyDef, mode: 'minor' } : keyDef).reverse()
  const home = scale[0]

  useEffect(() => stopAll, [])

  const marks: Record<number, KeyMark> = {}
  for (const n of scale) {
    marks[n.midi] = { tone: n.degree === 1 ? 'tonic' : 'scale', degree: n.degree, label: noteLabel(n, labelMode) }
  }

  const run = async (steps: Step[]) => {
    await ensureAudio()
    await playSequence(steps, setActive)
  }

  const playOne = async (midi: number) => {
    await ensureAudio()
    playNotes([midi], 1.2)
    setActive([midi])
    setTimeout(() => setActive((cur) => (cur.length === 1 && cur[0] === midi ? [] : cur)), 500)
  }

  const scaleSteps = (notes: ScaleNote[]): Step[] =>
    notes.map((n, i) => ({ midis: [n.midi], duration: i === notes.length - 1 ? 1.2 : 0.5, next: 0.5 }))

  const toggle = (
    <div className="view-toggle">
      <div className="segmented" role="radiogroup" aria-label="เลือกบทเรียน">
        {(
          [
            ['piano', '🎹 เปียโนและคีย์'],
            ['staff', '🎼 บรรทัด 5 เส้น'],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            role="radio"
            aria-checked={view === value}
            className={view === value ? 'selected' : ''}
            onClick={() => {
              stopAll()
              setActive([])
              setView(value)
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )

  if (view === 'staff') {
    return (
      <section className="page">
        {toggle}
        <StaffLesson />
      </section>
    )
  }

  return (
    <section className="page">
      {toggle}
      <Mascot>
        สวัสดี! ฉันชื่อ<b>น้องฮูก</b> 🦉 มารู้จักโน้ตกันนะ ลองแตะคีย์เปียโนสีๆ ข้างล่าง
        หรือกดปุ่ม <b>ไต่บันไดขึ้น</b> ฟังดูสิ
      </Mascot>

      <div className="card">
        <h2>🗝️ เลือกคีย์ที่อยากรู้จัก</h2>
        <KeySelector
          value={keyDef}
          onChange={(k) => {
            stopAll()
            setActive([])
            onKeyChange(k)
          }}
        />
      </div>

      <div className="card">
        <div className="key-heading">
          <div>
            <h2 className="key-title">คีย์ {keyName(keyDef)}</h2>
            <p className="muted">
              🏠 โน้ตบ้านคือ <b>{prettyNote(home.pc)}</b> · {signatureText(info)} · คีย์คู่หู: {info.relative}
            </p>
            {keyDef.mode === 'harmonic' && <p className="muted">✨ ตัวที่ 7 ถูกยกขึ้นครึ่งเสียง ให้อยากกลับบ้านมากขึ้น</p>}
            {keyDef.mode === 'melodic' && <p className="muted">✨ ขาขึ้นยกตัวที่ 6 และ 7 · ขาลงกลับเป็นไมเนอร์ธรรมดา</p>}
          </div>
          <LabelModeToggle value={labelMode} onChange={onLabelModeChange} />
        </div>

        <PianoKeyboard {...range} marks={marks} active={active} onPress={playOne} />
        <p className="hint">👆 แตะคีย์ไหนก็ได้ เพื่อฟังเสียง</p>

        <div className="degree-grid">
          {scale.slice(0, 7).map((n) => (
            <button
              key={n.degree}
              className={`degree-card deg-${n.degree}${active.includes(n.midi) ? ' active' : ''}`}
              onClick={() => playOne(n.midi)}
            >
              <span className="degree-num">{n.degree === 1 ? '🏠' : n.degree}</span>
              <span className="degree-sol">{n.solfege}</span>
              <span className="degree-note">{prettyNote(n.pc)}</span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="primary" onClick={() => run(scaleSteps(scale))}>
            🪜 ไต่บันไดขึ้น
          </button>
          <button onClick={() => run(scaleSteps(descending))}>🛝 ไต่บันไดลง</button>
          <button onClick={() => run([{ midis: tonicChord(root, minor), duration: 1.5 }])}>🏠 คอร์ดบ้าน</button>
          <button onClick={() => run(cadenceSteps(root, minor))}>🎶 เพลงบอกบ้าน</button>
          <button
            className="ghost"
            onClick={() => {
              stopAll()
              setActive([])
            }}
          >
            ⏹ หยุด
          </button>
        </div>
        <p className="hint">
          “เพลงบอกบ้าน” คือคอร์ด {minor ? 'i–iv–V–i' : 'I–IV–V–I'} (cadence) ที่ช่วยให้หูรู้ว่าบ้านอยู่ที่ไหน
        </p>
      </div>
    </section>
  )
}
