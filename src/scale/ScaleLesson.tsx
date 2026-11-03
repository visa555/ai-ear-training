import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { stopAll } from '../audio/engine'
import { ensureGuitar, playGuitarNote } from '../audio/guitar'
import { Fretboard, type FretMark } from '../components/Fretboard'
import { Mascot } from '../components/Mascot'
import { ToggleSwitch } from '../components/ToggleSwitch'
import { positionId } from '../guitar/fretboard'
import { keyName, prettyNote, type KeyDef } from '../theory/keys'
import {
  allScalePositions,
  ascendingOrder,
  buildAllPatterns,
  relativeKey,
  SCALE_KEYS,
  SCALE_MAX_FRET,
  type CagedShape,
  type ScalePosition,
} from './patterns'

/** จังหวะไล่สเกล (มิลลิวินาทีต่อโน้ต) */
const STEP_MS = 420

export function ScaleLesson() {
  const [majorKey, setMajorKey] = useState<KeyDef>(SCALE_KEYS[1])
  const [minorMode, setMinorMode] = useState(false)
  const [shape, setShape] = useState<CagedShape>('E')
  const [wholeNeck, setWholeNeck] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  /** เปลี่ยนค่าเพื่อยกเลิกการไล่สเกลที่กำลังเล่นอยู่ */
  const playToken = useRef(0)
  const [speech, setSpeech] = useState<ReactNode>(
    <>
      สเกลบนกีตาร์คือ<b>รูปนิ้ว</b> 🎸 เพราะ 1 เฟรต = ครึ่งเสียง รูปเดิมจึงใช้ได้ทุกคีย์ แค่เลื่อนขึ้นลงบนคอ
      ลองเลือกแพทเทิร์นแล้วกดไล่สเกลฟังดูนะ
    </>,
  )

  const key: KeyDef = minorMode ? relativeKey(majorKey) : majorKey
  const partner = relativeKey(key)
  const patterns = useMemo(() => buildAllPatterns(key), [key])
  const pattern = patterns.find((p) => p.shape === shape) ?? patterns[0]
  const neckNotes = useMemo(() => (wholeNeck ? allScalePositions(key) : []), [key, wholeNeck])

  useEffect(() => stopAll, [])

  const stop = () => {
    playToken.current++
    stopAll()
    setPlaying(false)
    setActive(null)
  }

  const play = async (descending: boolean) => {
    await ensureGuitar()
    const order = ascendingOrder(pattern)
    const notes = descending ? [...order].reverse() : order
    const token = ++playToken.current
    setPlaying(true)
    setSpeech(
      <>
        ไล่สเกล <b>{keyName(key)}</b> แพทเทิร์นรูป <b>{shape}</b> {descending ? 'จากสูงลงต่ำ' : 'จากต่ำขึ้นสูง'}{' '}
        ดูโน้ตรูทสีเข้มให้ดีนะ 🏠
      </>,
    )
    for (const [i, note] of notes.entries()) {
      // ผู้ใช้กดหยุดหรือเปลี่ยนแพทเทิร์นระหว่างเล่น
      if (playToken.current !== token) return
      playGuitarNote(note.midi, 0.9)
      setActive(positionId(note))
      await new Promise((r) => setTimeout(r, i === notes.length - 1 ? 700 : STEP_MS))
    }
    if (playToken.current !== token) return
    setPlaying(false)
    setActive(null)
  }

  const tap = async (stringNumber: number, fret: number) => {
    const inPattern = pattern.positions.find((n) => n.string === stringNumber && n.fret === fret)
    const note = inPattern ?? neckNotes.find((n) => n.string === stringNumber && n.fret === fret)
    if (!note) {
      setSpeech(<>ช่องนี้ไม่ได้อยู่ในสเกล {keyName(key)} นะ ลองแตะจุดที่มีสีดูสิ 🎯</>)
      setActive(null)
      return
    }
    await ensureGuitar()
    playGuitarNote(note.midi)
    setActive(positionId(note))
    setSpeech(
      <>
        สาย <b>{stringNumber}</b> เฟรต <b>{fret}</b> คือ{' '}
        <b className={`chip deg-${note.letterIndex + 1}`}>{prettyNote(note.pc)}</b> — ขั้นที่ <b>{note.degree}</b> ของสเกล
        {note.root && ' · เป็นโน้ตรูท 🏠'}
      </>,
    )
  }

  const markOf = (note: ScalePosition, faded: boolean): FretMark => ({
    state: note.root ? 'correct' : 'hint',
    root: note.root,
    label: prettyNote(note.pc),
    className: `${faded ? 'faded ' : ''}deg-${note.letterIndex + 1}`,
    title: `สาย ${note.string} เฟรต ${note.fret} · ${prettyNote(note.pc)} (ขั้นที่ ${note.degree})`,
  })

  const marks: Record<string, FretMark> = {}
  for (const note of neckNotes) marks[positionId(note)] = markOf(note, true)
  for (const note of pattern.positions) marks[positionId(note)] = markOf(note, false)
  if (active) marks[active] = { ...marks[active], state: 'ask' }

  return (
    <>
      <h2 className="section-title">🎼 สเกลบนคอกีตาร์</h2>
      <Mascot mood={playing ? 'listen' : 'idle'}>{speech}</Mascot>

      <div className="card">
        <h3 className="first">1️⃣ เลือกคีย์</h3>
        <div className="key-selector">
          {SCALE_KEYS.map((k) => (
            <button
              key={k.tonic}
              className={k.tonic === majorKey.tonic ? 'selected' : ''}
              onClick={() => {
                stop()
                setMajorKey(k)
              }}
            >
              <span className="key-name">{prettyNote(k.tonic)}</span>
              <span className="key-sig">{prettyNote(relativeKey(k).tonic)}m</span>
            </button>
          ))}
        </div>

        <ToggleSwitch
          checked={minorMode}
          onChange={(v) => {
            stop()
            setMinorMode(v)
          }}
        >
          {minorMode ? '🌙' : '☀️'} <b>ตอนนี้เล่นเป็น {keyName(key)}</b>
          <small>สลับไป {keyName(partner)} · รูปนิ้วเหมือนเดิมเป๊ะ ย้ายแค่โน้ตรูท</small>
        </ToggleSwitch>
      </div>

      <div className="card">
        <h3 className="first">2️⃣ เลือกแพทเทิร์น (CAGED)</h3>
        <p className="muted">เรียงจากเฟรตต่ำไปสูง · แต่ละรูปตั้งชื่อตามคอร์ดเปิดที่หน้าตาเหมือนกัน</p>
        <div className="caged-row">
          {patterns.map((p) => (
            <button
              key={p.shape}
              className={`caged${p.shape === shape ? ' selected' : ''}`}
              onClick={() => {
                stop()
                setShape(p.shape)
              }}
            >
              <span className="caged-letter">{p.shape}</span>
              <small>เฟรต {p.from}–{p.to}</small>
            </button>
          ))}
        </div>

        <div className="fretboard-scroll">
          <Fretboard
            frets={SCALE_MAX_FRET}
            marks={marks}
            onPress={tap}
            ariaLabel={`สเกล ${keyName(key)} แพทเทิร์นรูป ${shape}`}
          />
        </div>
        <p className="hint">👆 แตะจุดบนคอเพื่อฟังเสียงและดูว่าเป็นขั้นที่เท่าไร · วงใหญ่สีเข้มคือโน้ตรูท 🏠</p>

        <ToggleSwitch checked={wholeNeck} onChange={setWholeNeck}>
          🗺️ <b>ดูโน้ตในสเกลทั้งคอ</b>
          <small>จุดจางคือโน้ตในสเกลที่อยู่นอกแพทเทิร์นนี้ · เห็นว่าแพทเทิร์นต่อกันตรงไหน</small>
        </ToggleSwitch>

        <div className="actions">
          <button className="primary" disabled={playing} onClick={() => play(false)}>
            🔼 ไล่สเกลขึ้น
          </button>
          <button disabled={playing} onClick={() => play(true)}>
            🔽 ไล่สเกลลง
          </button>
          <button className="ghost" onClick={stop}>
            ⏹ หยุด
          </button>
        </div>

        <div className="lesson-cards">
          <div className="lesson-card">
            <h3>🔤 CAGED คืออะไร</h3>
            <p>สเกลหนึ่งคีย์ปูเต็มคอได้ด้วยรูป 5 แบบ ตั้งชื่อตามคอร์ดเปิด C–A–G–E–D</p>
            <p>แต่ละรูปกินประมาณ 4 เฟรต และซ้อนทับรูปข้างๆ จึงต่อกันได้ไม่ขาดตอน</p>
            <p>ครบ 5 รูปแล้วจะวนกลับมารูปเดิมที่เฟรต 12 พอดี</p>
            <p>ทุกรูปใช้นิ้วกดทุกตัว ไม่ใช้สายเปล่า เลื่อนไปคีย์ไหนก็ใช้รูปเดิมได้เลย</p>
          </div>
          <div className="lesson-card wide">
            <h3>🤝 เมเจอร์กับไมเนอร์ใช้รูปเดียวกัน</h3>
            <p>
              <b>{keyName(majorKey)}</b> กับ <b>{keyName(relativeKey(majorKey))}</b> ใช้โน้ตชุดเดียวกันทุกตัว
              ต่างกันแค่ว่าใครเป็น “รูท”
            </p>
            <p>หาไมเนอร์คู่หู: นับลง <b>3 เฟรต</b> จากโน้ตรูทของเมเจอร์ (หรือขึ้นไปขั้นที่ 6 ของสเกล)</p>
            <p>เพราะงั้นจำรูปนิ้ว 5 แบบครั้งเดียว ใช้ได้ทั้งเมเจอร์และไมเนอร์ 🎉 ลองกดสวิตช์สลับดูข้างบน</p>
          </div>
          <div className="lesson-card">
            <h3>🏠 โน้ตรูทสำคัญที่สุด</h3>
            <p>เวลาซ้อม ให้เริ่มและจบที่โน้ตรูทเสมอ หูจะจำได้ว่าคีย์นี้ฟังแล้วรู้สึกยังไง</p>
            <p>รูปนิ้วเหมือนกัน แต่ถ้าเริ่มคนละโน้ต อารมณ์เพลงจะเปลี่ยนจากสดใสเป็นเศร้าทันที</p>
          </div>
        </div>
      </div>
    </>
  )
}
