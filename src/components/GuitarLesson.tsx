import { useEffect, useState, type ReactNode } from 'react'
import { stopAll } from '../audio/engine'
import { ensureGuitar, playGuitarNote, strumNotes } from '../audio/guitar'
import { LETTERS } from '../notation/staff'
 import { prettyNote } from '../theory/keys'
import { CHROMATIC, noteAt, positionId, positionsOf, STRINGS } from '../guitar/fretboard'
import { Fretboard, type FretMark } from './Fretboard'
import { Mascot } from './Mascot'

const SHOW_FRETS = 12
/** โน้ตธรรมชาติที่ให้เลือกดูว่าอยู่ตรงไหนบ้างบนคอ */
/** โน้ตทั้ง 12 ตัวให้เลือกดูว่าอยู่ตรงไหนบ้างบนคอ (โน้ตติดชาร์ปใช้สีของตัวอักษรหน้ามัน) */
const PICKABLE = CHROMATIC.map((pc) => ({
  pc,
  letterIndex: LETTERS.indexOf(pc[0] as (typeof LETTERS)[number]),
}))

export function GuitarLesson() {
  const [picked, setPicked] = useState<string | null>(null)
  const [active, setActive] = useState<string | null>(null)
  const [speech, setSpeech] = useState<ReactNode>(
    <>
      นี่คือ<b>คอกีตาร์</b> 🎸 สาย 1 เส้นเล็กสุดอยู่<b>บน</b> สาย 6 เส้นใหญ่สุดอยู่<b>ล่าง</b> เหมือนตอนก้มมองกีตาร์ของตัวเอง
      ลองแตะช่องไหนก็ได้เพื่อฟังเสียงนะ
    </>,
  )

  useEffect(() => stopAll, [])

  const tap = async (stringNumber: number, fret: number) => {
    const note = noteAt(stringNumber, fret)
    await ensureGuitar()
    playGuitarNote(note.midi)
    setActive(positionId(note))
    setSpeech(
      <>
        สาย <b>{stringNumber}</b> เฟรต <b>{fret}</b> คือโน้ต{' '}
        <b className={`chip deg-${note.letterIndex + 1}`}>{prettyNote(note.pc)}</b>
        {fret === 0 && ' · เป็นสายเปล่า ไม่ต้องกดนิ้วเลย'}
        {fret === 12 && ' · เฟรต 12 ชื่อเหมือนสายเปล่า แต่สูงขึ้น 1 ออคเทฟ'}
      </>,
    )
  }

  const playOpenStrings = async () => {
    await ensureGuitar()
    setPicked(null)
    setActive(null)
    setSpeech(
      <>
        ฟังสายเปล่าจากสาย 6 ไปสาย 1: <b>E A D G B E</b> 🎸 จำง่ายๆ ว่า “<b>เอ๋ อา ดี จี บี อี</b>”
      </>,
    )
    strumNotes(
      [...STRINGS].sort((a, b) => b.number - a.number).map((s) => s.openMidi),
      0.5,
    )
  }

  const pick = (pc: string) => {
    const next = picked === pc ? null : pc
    setPicked(next)
    setActive(null)
    setSpeech(
      next ? (
        <>
          โน้ต <b className={`chip deg-${LETTERS.indexOf(next[0] as (typeof LETTERS)[number]) + 1}`}>{prettyNote(next)}</b>{' '}
          อยู่บนคอหลายที่เลย! ลองแตะฟังทีละจุด แล้วดูว่ารูปทรงซ้ำกันยังไง 👀
        </>
      ) : (
        <>แตะช่องบนคอเพื่อฟังเสียง หรือเลือกชื่อโน้ตข้างล่างเพื่อดูว่าอยู่ตรงไหนบ้าง</>
      ),
    )
  }

  const marks: Record<string, FretMark> = {}
  if (picked) {
    for (const note of positionsOf(picked, SHOW_FRETS)) {
      marks[positionId(note)] = { state: 'hint', label: prettyNote(note.pc), className: `deg-${note.letterIndex + 1}` }
    }
  }
  if (active) {
    const [s, f] = active.split('-').map(Number)
    const note = noteAt(s, f)
    marks[active] = { state: 'correct', label: prettyNote(note.pc), className: `deg-${note.letterIndex + 1}` }
  }

  return (
    <>
      <h2 className="section-title">🎸 คอกีตาร์</h2>
      <Mascot mood={active || picked ? 'happy' : 'idle'}>{speech}</Mascot>

      <div className="card">
        <div className="fretboard-scroll">
          <Fretboard frets={SHOW_FRETS} marks={marks} onPress={tap} ariaLabel="คอกีตาร์ เฟรต 0 ถึง 12" />
        </div>
        <p className="hint">👆 แตะช่องบนคอเพื่อฟังเสียง · เลื่อนซ้ายขวาได้ถ้าคอยาวเกินจอ</p>

        <h3>🔍 โน้ตนี้อยู่ตรงไหนบ้าง</h3>
        <div className="note-pick">
          {PICKABLE.map((p) => (
            <button
              key={p.pc}
              className={`deg-${p.letterIndex + 1}${picked === p.pc ? ' selected' : ''}${p.pc.includes('#') ? ' sharp' : ''}`}
              onClick={() => pick(p.pc)}
            >
              {prettyNote(p.pc)}
            </button>
          ))}
        </div>

        <div className="actions">
          <button className="primary" onClick={playOpenStrings}>
            🎸 ฟังสายเปล่าทั้ง 6 สาย
          </button>
          <button
            className="ghost"
            onClick={() => {
              stopAll()
              setPicked(null)
              setActive(null)
            }}
          >
            ⏹ หยุด
          </button>
        </div>

        <div className="lesson-cards">
          <div className="lesson-card">
            <h3>🔢 เลขสาย</h3>
            <p>
              สาย <b>1</b> = เส้นเล็กสุด (E สูง) · สาย <b>6</b> = เส้นใหญ่สุด (E ต่ำ)
            </p>
            <p>สาย 1 กับสาย 6 ชื่อโน้ตเหมือนกันทุกเฟรต จำทีเดียวได้สองสาย!</p>
          </div>
          <div className="lesson-card">
            <h3>⚪ จุดบนคอ</h3>
            <p>จุดอยู่ที่เฟรต 3, 5, 7, 9 และจุดคู่ที่เฟรต 12</p>
            <p>ใช้จุดเป็นหมุดจำ เช่น สาย 6 เฟรต 3 = G · สาย 5 เฟรต 3 = C</p>
          </div>
          <div className="lesson-card">
            <h3>♯ โน้ตติดชาร์ป</h3>
            <p>ช่องที่อยู่ระหว่างโน้ตธรรมชาติคือโน้ตติดชาร์ป เช่น ระหว่าง F กับ G คือ F♯</p>
            <p>จำ 7 ตัวหลักให้แม่นก่อน แล้วค่อยนับขึ้น 1 เฟรตเพื่อหาชาร์ป</p>
            <p>คู่ที่ไม่มีช่องคั่น (ไม่มีชาร์ป) คือ E–F และ B–C</p>
          </div>
          <div className="lesson-card">
            <h3>📐 รูปทรงจำโน้ต</h3>
            <p>โน้ตเดิมจะอยู่ “ขึ้นไป 2 สาย แล้วไป 2 เฟรต” เช่น สาย 6 เฟรต 3 (G) กับ สาย 4 เฟรต 5 (G)</p>
            <p>ยกเว้นคู่สาย 3–2 (G กับ B) ที่ต้องบวกอีก 1 เฟรต</p>
          </div>
        </div>
      </div>
    </>
  )
}
