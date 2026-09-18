import { useEffect, useState } from 'react'
import { cadenceSteps, tonicChord } from '../audio/cadence'
import { ensureAudio, playNotes, playSequence, stopAll, type Step } from '../audio/engine'
import { KeySelector } from '../components/KeySelector'
import { LabelModeToggle } from '../components/LabelModeToggle'
import { PianoKeyboard, type KeyMark } from '../components/PianoKeyboard'
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

export function ExplorerPage({ keyDef, onKeyChange, labelMode, onLabelModeChange }: Props) {
  const [active, setActive] = useState<number[]>([])
  const info = keyInfo(keyDef)
  const scale = scaleWithTopTonic(keyDef)
  const root = tonicMidi(keyDef)
  const minor = isMinor(keyDef.mode)
  const range = keyboardRange(root, root + 12)
  // เมโลดิกไมเนอร์แบบดั้งเดิม: ขาลงกลับไปใช้ natural minor
  const descending = scaleWithTopTonic(keyDef.mode === 'melodic' ? { ...keyDef, mode: 'minor' } : keyDef).reverse()

  useEffect(() => stopAll, [])

  const marks: Record<number, KeyMark> = {}
  for (const n of scale) marks[n.midi] = { tone: n.degree === 1 ? 'tonic' : 'scale', label: noteLabel(n, labelMode) }

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

  return (
    <section className="page">
      <div className="card">
        <h2>เลือกคีย์</h2>
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
            <h2>{keyName(keyDef)}</h2>
            <p className="muted">
              {signatureText(info)} · relative: {info.relative}
            </p>
            {keyDef.mode === 'harmonic' && <p className="muted">ขั้นที่ 7 ยกขึ้นครึ่งเสียง (leading tone) จาก natural minor</p>}
            {keyDef.mode === 'melodic' && (
              <p className="muted">ขาขึ้นยกขั้นที่ 6 และ 7 · ขาลงแบบดั้งเดิมกลับเป็น natural minor</p>
            )}
          </div>
          <LabelModeToggle value={labelMode} onChange={onLabelModeChange} />
        </div>

        <PianoKeyboard {...range} marks={marks} active={active} onPress={playOne} />
        <p className="hint">แตะคีย์ใดก็ได้บนเปียโนเพื่อฟังเสียง</p>

        <div className="degree-grid">
          {scale.slice(0, 7).map((n) => (
            <button
              key={n.degree}
              className={`degree-card${active.includes(n.midi) ? ' active' : ''}${n.degree === 1 ? ' tonic' : ''}`}
              onClick={() => playOne(n.midi)}
            >
              <span className="degree-num">{n.degree}</span>
              <span className="degree-note">{prettyNote(n.pc)}</span>
              <span className="degree-sol">{n.solfege}</span>
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="primary" onClick={() => run(scaleSteps(scale))}>
            ▶ สเกลขาขึ้น
          </button>
          <button onClick={() => run(scaleSteps(descending))}>▶ สเกลขาลง</button>
          <button onClick={() => run([{ midis: tonicChord(root, minor), duration: 1.5 }])}>▶ คอร์ดโทนิก</button>
          <button onClick={() => run(cadenceSteps(root, minor))}>▶ Cadence {minor ? 'i–iv–V–i' : 'I–IV–V–I'}</button>
          <button
            className="ghost"
            onClick={() => {
              stopAll()
              setActive([])
            }}
          >
            ■ หยุด
          </button>
        </div>
      </div>
    </section>
  )
}
