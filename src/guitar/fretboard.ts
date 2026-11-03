import { Note } from '@tonaljs/tonal'
import { LETTERS } from '../notation/staff'

/** สายกีตาร์ตั้งมาตรฐาน: สาย 1 เส้นเล็กสุด (E สูง) → สาย 6 เส้นใหญ่สุด (E ต่ำ) */
export const STRINGS: { number: number; open: string; openMidi: number }[] = [
  { number: 1, open: 'E4', openMidi: 64 },
  { number: 2, open: 'B3', openMidi: 59 },
  { number: 3, open: 'G3', openMidi: 55 },
  { number: 4, open: 'D3', openMidi: 50 },
  { number: 5, open: 'A2', openMidi: 45 },
  { number: 6, open: 'E2', openMidi: 40 },
]

/** เฟรตที่มีจุดบนคอ (เฟรต 12 เป็นจุดคู่) */
export const INLAY_FRETS = [3, 5, 7, 9]
export const DOUBLE_INLAY_FRET = 12
export const MAX_FRET = 12

export interface FretNote {
  /** หมายเลขสาย 1–6 */
  string: number
  fret: number
  midi: number
  /** ชื่อพร้อมออคเทฟ เช่น "A2" */
  name: string
  /** ตัวอักษรชื่อโน้ต เช่น "A" (โน้ตติดชาร์ปจะมี # ต่อท้าย) */
  pc: string
  /** โน้ตธรรมชาติ (ไม่มีชาร์ป/แฟลต) */
  natural: boolean
  /** 0 = C … 6 = B ใช้เลือกสีประจำโน้ต (โน้ตติดชาร์ปใช้สีของตัวอักษรหน้ามัน) */
  letterIndex: number
}

function stringByNumber(stringNumber: number) {
  const s = STRINGS.find((x) => x.number === stringNumber)
  if (!s) throw new Error(`Unknown string: ${stringNumber}`)
  return s
}

/** โน้ตที่สายและเฟรตที่กำหนด (เฟรต 0 = สายเปล่า) */
export function noteAt(stringNumber: number, fret: number): FretNote {
  const midi = stringByNumber(stringNumber).openMidi + fret
  const name = Note.fromMidiSharps(midi)
  const pc = Note.pitchClass(name)
  return {
    string: stringNumber,
    fret,
    midi,
    name,
    pc,
    natural: !pc.includes('#'),
    letterIndex: LETTERS.indexOf(pc[0] as (typeof LETTERS)[number]),
  }
}

/** ทุกตำแหน่งของโน้ตตัวหนึ่ง (เทียบจากชื่อตัวอักษร ไม่สนออคเทฟ) */
export function positionsOf(pc: string, maxFret = MAX_FRET): FretNote[] {
  const found: FretNote[] = []
  for (const s of STRINGS) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = noteAt(s.number, fret)
      if (note.pc === pc) found.push(note)
    }
  }
  return found
}

export const positionId = (note: { string: number; fret: number }) => `${note.string}-${note.fret}`

export interface GuitarLevel {
  icon: string
  name: string
  hint: string
  /** สายที่ใช้ในด่านนี้ */
  strings: number[]
  /** เฟรตต่ำสุด–สูงสุดที่ถาม */
  frets: [number, number]
  /** จำนวนเฟรตที่แสดงบนคอ */
  showFrets: number
  /** รวมโน้ตติดชาร์ปด้วย (ปกติถามเฉพาะโน้ตธรรมชาติ) */
  accidentals?: boolean
}

export const GUITAR_LEVELS: GuitarLevel[] = [
  { icon: '🐣', name: 'ระดับ 1', hint: 'สายเปล่า 6 สาย', strings: [1, 2, 3, 4, 5, 6], frets: [0, 0], showFrets: 5 },
  { icon: '🐥', name: 'ระดับ 2', hint: 'สาย 6 กับ 1 · เฟรต 0–5', strings: [6, 1], frets: [0, 5], showFrets: 5 },
  { icon: '🦅', name: 'ระดับ 3', hint: 'ทุกสาย · เฟรต 0–5', strings: [1, 2, 3, 4, 5, 6], frets: [0, 5], showFrets: 5 },
  { icon: '🚀', name: 'ระดับ 4', hint: 'ทุกสาย · เฟรต 0–12', strings: [1, 2, 3, 4, 5, 6], frets: [0, 12], showFrets: 12 },
  {
    icon: '👑',
    name: 'ระดับ 5',
    hint: 'เฟรต 0–12 + โน้ตติดชาร์ป',
    strings: [1, 2, 3, 4, 5, 6],
    frets: [0, 12],
    showFrets: 12,
    accidentals: true,
  },
]

/** ช่องทั้งหมดที่ด่านนี้สุ่มได้ (ปกติเฉพาะโน้ตธรรมชาติ · ด่านที่เปิด accidentals จะรวมโน้ตติดชาร์ป) */
export function levelPool(level: GuitarLevel): FretNote[] {
  const pool: FretNote[] = []
  for (const stringNumber of [...level.strings].sort((a, b) => a - b)) {
    for (let fret = level.frets[0]; fret <= level.frets[1]; fret++) {
      const note = noteAt(stringNumber, fret)
      if (note.natural || level.accidentals) pool.push(note)
    }
  }
  return pool
}

/** ชื่อโน้ตทั้ง 12 ตัวเรียงตามลำดับเสียง (ใช้เรียงปุ่มคำตอบ) */
export const CHROMATIC = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
