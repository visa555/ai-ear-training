import { Note } from '@tonaljs/tonal'

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
/** โด แบบตายตัวสำหรับการอ่านโน้ต: C = Do เสมอ */
export const FIXED_SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'] as const

/** ตำแหน่งบนบรรทัด นับเป็นครึ่งช่อง: 0 = เส้นล่างสุด (E4 ในกุญแจซอล), 8 = เส้นบนสุด (F5) */
export type StaffPos = number

export interface StaffNote {
  /** เช่น "E4" */
  name: string
  letter: string
  /** 0 = C … 6 = B ใช้เลือกสีประจำโน้ต */
  letterIndex: number
  octave: number
  midi: number
  pos: StaffPos
}

const TREBLE_BOTTOM_LINE = diatonic('E', 4)

function diatonic(letter: string, octave: number): number {
  return octave * 7 + LETTERS.indexOf(letter as (typeof LETTERS)[number])
}

/** รองรับเฉพาะโน้ตธรรมชาติ (ไม่มีชาร์ป/แฟลต) ในเฟสนี้ */
export function staffNote(name: string): StaffNote {
  const match = /^([A-G])(\d)$/.exec(name)
  if (!match) throw new Error(`Unsupported note: ${name}`)
  const letter = match[1]
  const octave = Number(match[2])
  return {
    name,
    letter,
    letterIndex: LETTERS.indexOf(letter as (typeof LETTERS)[number]),
    octave,
    midi: Note.midi(name)!,
    pos: diatonic(letter, octave) - TREBLE_BOTTOM_LINE,
  }
}

/** โน้ตธรรมชาติทุกตัวตั้งแต่ from ถึง to (รวมทั้งสองฝั่ง) */
export function naturalRange(from: string, to: string): StaffNote[] {
  const start = staffNote(from)
  const end = staffNote(to)
  const notes: StaffNote[] = []
  for (let d = diatonic(start.letter, start.octave); d <= diatonic(end.letter, end.octave); d++) {
    notes.push(staffNote(`${LETTERS[d % 7]}${Math.floor(d / 7)}`))
  }
  return notes
}

export const isOnLine = (pos: StaffPos) => pos % 2 === 0

/** เส้นน้อยที่ต้องขีดสำหรับโน้ตนอกบรรทัด */
export function ledgerLines(pos: StaffPos): StaffPos[] {
  const lines: StaffPos[] = []
  for (let p = -2; p >= pos; p -= 2) lines.push(p)
  for (let p = 10; p <= pos; p += 2) lines.push(p)
  return lines
}

/** หางโน้ตชี้ขึ้นเมื่ออยู่ต่ำกว่าเส้นกลาง ชี้ลงเมื่ออยู่ที่เส้นกลางขึ้นไป */
export const stemUp = (pos: StaffPos) => pos < 4

/** บอกตำแหน่งเป็นภาษาไทยแบบที่เด็กเข้าใจ (นับเส้นและช่องจากล่างขึ้นบน) */
export function describePosition(pos: StaffPos): string {
  if (pos >= 0 && pos <= 8) {
    return isOnLine(pos) ? `อยู่บนเส้นที่ ${pos / 2 + 1}` : `อยู่ในช่องที่ ${(pos + 1) / 2}`
  }
  if (pos === -1) return 'ห้อยอยู่ใต้เส้นที่ 1'
  if (pos === 9) return 'นั่งอยู่บนเส้นที่ 5'
  if (pos < 0) {
    return isOnLine(pos) ? `มีเส้นน้อยขีดทับ (เส้นน้อยที่ ${-pos / 2} ใต้บรรทัด)` : `ห้อยอยู่ใต้เส้นน้อยที่ ${(-pos - 1) / 2}`
  }
  return isOnLine(pos)
    ? `มีเส้นน้อยขีดทับ (เส้นน้อยที่ ${(pos - 8) / 2} เหนือบรรทัด)`
    : `นั่งอยู่บนเส้นน้อยที่ ${(pos - 9) / 2}`
}

export function fixedSolfege(note: Pick<StaffNote, 'letterIndex'>): string {
  return FIXED_SOLFEGE[note.letterIndex]
}
