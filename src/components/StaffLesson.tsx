import { useEffect, useState, type ReactNode } from 'react'
import { ensureAudio, playNotes, playSequence, stopAll } from '../audio/engine'
import { describePosition, fixedSolfege, naturalRange, staffNote } from '../notation/staff'
import { keyboardRange } from '../theory/keys'
import { Mascot } from './Mascot'
import { PianoKeyboard, type KeyMark } from './PianoKeyboard'
import { Staff } from './Staff'

const LESSON_NOTES = naturalRange('C4', 'C5')
const byMidi = new Map(LESSON_NOTES.map((n) => [n.midi, n]))

function noteChip(name: string) {
  const n = staffNote(name)
  return (
    <b className={`chip deg-${n.letterIndex + 1}`}>
      {n.letter} · {fixedSolfege(n)}
    </b>
  )
}

export function StaffLesson() {
  const [colored, setColored] = useState(true)
  const [active, setActive] = useState<string | null>(null)
  const [speech, setSpeech] = useState<ReactNode>(
    <>
      นี่คือ<b>บรรทัด 5 เส้น</b> ที่ใช้เขียนโน้ตดนตรี 🎼 ลองแตะโน้ตบนบรรทัด หรือแตะคีย์เปียโนข้างล่างดูสิ
    </>,
  )

  useEffect(() => stopAll, [])

  const show = (name: string) => {
    setActive(name)
    setSpeech(
      <>
        นี่คือ {noteChip(name)} {describePosition(staffNote(name).pos)}
        {name === 'C4' && ' · เรียกว่า “โดกลาง” เพราะอยู่ตรงกลางเปียโนพอดี'}
        {name === 'G4' && ' · เส้นนี้แหละที่กุญแจซอลม้วนพันอยู่'}
      </>,
    )
  }

  const tapNote = async (name: string) => {
    await ensureAudio()
    playNotes([staffNote(name).midi], 1.2)
    show(name)
  }

  const tapKey = async (midi: number) => {
    await ensureAudio()
    playNotes([midi], 1.2)
    const note = byMidi.get(midi)
    if (note) show(note.name)
    else {
      setActive(null)
      setSpeech(<>คีย์นี้ไม่ได้อยู่ในบทเรียนนี้นะ ลองแตะคีย์ที่มีสีดูสิ 🌈</>)
    }
  }

  const climb = async () => {
    await ensureAudio()
    setSpeech(<>ไต่บันไดกัน! ดูโน้ตขยับจาก<b>เส้น</b>ไป<b>ช่อง</b> ขึ้นทีละขั้นนะ 🪜</>)
    await playSequence(
      LESSON_NOTES.map((n, i) => ({ midis: [n.midi], duration: i === LESSON_NOTES.length - 1 ? 1.2 : 0.55, next: 0.6 })),
      (midis) => setActive(midis.length ? (byMidi.get(midis[0])?.name ?? null) : null),
    )
  }

  const activeMidi = active ? staffNote(active).midi : null
  const range = keyboardRange(60, 72)
  const marks: Record<number, KeyMark> = {}
  for (const n of LESSON_NOTES) {
    marks[n.midi] = {
      tone: n.name === 'C4' ? 'tonic' : 'scale',
      degree: colored ? n.letterIndex + 1 : undefined,
      label: n.letter,
    }
  }

  return (
    <>
      <Mascot mood={active ? 'happy' : 'idle'}>{speech}</Mascot>

      <div className="card">
        <div className="key-heading">
          <div>
            <h2 className="key-title">🎼 บรรทัด 5 เส้น</h2>
            <p className="muted">กุญแจซอล · โน้ตตั้งแต่โดกลาง (C) ถึงโดตัวบน</p>
          </div>
          <label className="switch">
            <input type="checkbox" checked={colored} onChange={(e) => setColored(e.target.checked)} />
            🎨 หัวโน้ตสี
          </label>
        </div>

        <div className="staff-box">
          <Staff
            colored={colored}
            spread={0.8}
            onNoteClick={tapNote}
            ariaLabel="บรรทัด 5 เส้น โน้ต C ถึง C ตัวบน"
            notes={LESSON_NOTES.map((n) => ({
              name: n.name,
              state: n.name === active ? 'active' : undefined,
              label: `${n.letter} ${fixedSolfege(n)}`,
            }))}
          />
        </div>

        <PianoKeyboard {...range} marks={marks} active={activeMidi === null ? [] : [activeMidi]} onPress={tapKey} />

        <div className="actions">
          <button className="primary" onClick={climb}>
            🪜 ไต่บันไดบนบรรทัด
          </button>
          <button
            className="ghost"
            onClick={() => {
              stopAll()
              setActive(null)
            }}
          >
            ⏹ หยุด
          </button>
        </div>

        <div className="lesson-cards">
          <div className="lesson-card">
            <h3>📏 บนเส้น กับ ในช่อง</h3>
            <p>นับเส้นจาก<b>ล่างขึ้นบน</b> เส้นล่างสุดคือเส้นที่ 1</p>
            <p>โน้ตบางตัวมีเส้นขีดผ่านกลางตัว เรียกว่า “บนเส้น” บางตัวอยู่ระหว่างเส้น เรียกว่า “ในช่อง”</p>
            <p>ไต่ขึ้นทีละขั้นจะสลับ เส้น → ช่อง → เส้น → ช่อง เสมอ</p>
          </div>
          <div className="lesson-card">
            <h3>📍 โน้ตจุดสังเกต</h3>
            <p>{noteChip('C4')} โดกลาง มีเส้นน้อยขีดทับ อยู่ใต้บรรทัด</p>
            <p>{noteChip('G4')} อยู่บนเส้นที่ 2 ที่กุญแจซอลม้วนพันอยู่</p>
            <p>จำ 2 ตัวนี้ได้ แล้วค่อยนับขึ้นลงไปหาตัวอื่น</p>
          </div>
          <div className="lesson-card">
            <h3>🐔 คำช่วยจำ</h3>
            <p>
              โน้ตบนเส้น 1–5: <span className="mnemonic">E G B D F</span>
              <br />
              “<b>เอ๋! ไก่บินดูฟ้า</b>” 🐔
            </p>
            <p>
              โน้ตในช่อง 1–4: <span className="mnemonic">F A C E</span>
              <br />
              สะกดว่า FACE แปลว่า “<b>ใบหน้า</b>” 😊
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
