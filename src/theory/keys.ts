import { Key, Note } from '@tonaljs/tonal'

/** major, natural minor, harmonic minor, melodic minor (ขาขึ้น) */
export type Mode = 'major' | 'minor' | 'harmonic' | 'melodic'

export interface KeyDef {
  tonic: string
  mode: Mode
}

export const MODES: { value: Mode; label: string }[] = [
  { value: 'major', label: 'เมเจอร์' },
  { value: 'minor', label: 'ไมเนอร์ (natural)' },
  { value: 'harmonic', label: 'ฮาร์โมนิกไมเนอร์' },
  { value: 'melodic', label: 'เมโลดิกไมเนอร์' },
]

/** เรียงตาม circle of fifths และใช้ชื่อที่นิยมเขียน */
export const MAJOR_TONICS = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'Db', 'Ab', 'Eb', 'Bb', 'F']
export const MINOR_TONICS = ['A', 'E', 'B', 'F#', 'C#', 'G#', 'Eb', 'Bb', 'F', 'C', 'G', 'D']

export const DEGREES = [1, 2, 3, 4, 5, 6, 7] as const

const INTERVALS: Record<Mode, string[]> = {
  major: ['1P', '2M', '3M', '4P', '5P', '6M', '7M'],
  minor: ['1P', '2M', '3m', '4P', '5P', '6m', '7m'],
  harmonic: ['1P', '2M', '3m', '4P', '5P', '6m', '7M'],
  melodic: ['1P', '2M', '3m', '4P', '5P', '6M', '7M'],
}

/** movable do แบบ do-based: ไมเนอร์ใช้ Me Le Te สำหรับขั้นที่ต่ำลงครึ่งเสียง */
const SOLFEGE_BY_SEMITONES: Record<number, string> = {
  0: 'Do', 2: 'Re', 3: 'Me', 4: 'Mi', 5: 'Fa', 7: 'Sol', 8: 'Le', 9: 'La', 10: 'Te', 11: 'Ti',
}

const SHARP_ORDER = ['F#', 'C#', 'G#', 'D#', 'A#', 'E#', 'B#']
const FLAT_ORDER = ['Bb', 'Eb', 'Ab', 'Db', 'Gb', 'Cb', 'Fb']

export interface ScaleNote {
  degree: number
  /** pitch class เช่น "F#" */
  pc: string
  /** ชื่อพร้อมออคเทฟ เช่น "F#4" */
  name: string
  midi: number
  solfege: string
  /** ออคเทฟนี้ห่างจากออคเทฟหลักของคีย์กี่ออคเทฟ */
  octaveShift: number
}

export const isMinor = (mode: Mode) => mode !== 'major'

export function tonicsFor(mode: Mode): string[] {
  return isMinor(mode) ? MINOR_TONICS : MAJOR_TONICS
}

/** หาโทนิกในรายการของโหมดใหม่ที่เป็นเสียงเดียวกัน เช่น D# ไมเนอร์ ↔ Eb */
export function matchTonic(tonic: string, mode: Mode): string {
  const chroma = Note.chroma(tonic)
  return tonicsFor(mode).find((t) => Note.chroma(t) === chroma) ?? tonicsFor(mode)[0]
}

export function sameKey(a: KeyDef, b: KeyDef) {
  return a.tonic === b.tonic && a.mode === b.mode
}

/** เลือกออคเทฟของโทนิกให้อยู่ช่วง G3–F#4 เพื่อให้ทุกคีย์ฟังในช่วงเสียงใกล้เคียงกัน */
export function tonicOctave(tonic: string): number {
  return (Note.chroma(tonic) ?? 0) >= 7 ? 3 : 4
}

export function tonicMidi(key: KeyDef, octaveShift = 0): number {
  return Note.midi(`${key.tonic}${tonicOctave(key.tonic) + octaveShift}`)!
}

/** โน๊ต 7 ตัวของสเกล เริ่มจากโทนิกในออคเทฟที่เลื่อนไป octaveShift */
export function scaleNotes(key: KeyDef, octaveShift = 0): ScaleNote[] {
  const root = `${key.tonic}${tonicOctave(key.tonic) + octaveShift}`
  const rootMidi = Note.midi(root)!
  return INTERVALS[key.mode].map((interval, i) => {
    const name = Note.transpose(root, interval)
    const midi = Note.midi(name)!
    return {
      degree: i + 1,
      pc: Note.pitchClass(name),
      name,
      midi,
      solfege: SOLFEGE_BY_SEMITONES[midi - rootMidi],
      octaveShift,
    }
  })
}

/** สเกล 1 ออคเทฟรวมโทนิกตัวบน (8 โน๊ต) สำหรับเล่นไล่สเกล */
export function scaleWithTopTonic(key: KeyDef): ScaleNote[] {
  return [...scaleNotes(key), scaleNotes(key, 1)[0]]
}

export interface KeyInfo {
  /** จำนวนชาร์ป (บวก) หรือแฟลต (ลบ) */
  alteration: number
  /** เครื่องหมายใน key signature เรียงตามลำดับมาตรฐาน */
  accidentals: string[]
  /** คีย์คู่ relative เช่น "A minor" */
  relative: string
}

export function keyInfo(key: KeyDef): KeyInfo {
  const minor = isMinor(key.mode)
  const k = minor ? Key.minorKey(key.tonic) : Key.majorKey(key.tonic)
  // key signature มาจากสเกลธรรมชาติเสมอ (harmonic/melodic ใช้ signature เดียวกับ natural minor)
  const signatureScale = minor ? Key.minorKey(key.tonic).natural.scale : Key.majorKey(key.tonic).scale
  const order = k.alteration > 0 ? SHARP_ORDER : FLAT_ORDER
  return {
    alteration: k.alteration,
    accidentals: order.filter((n) => signatureScale.includes(n)),
    relative: minor
      ? `${prettyNote(Key.minorKey(key.tonic).relativeMajor)} Major`
      : `${prettyNote(Key.majorKey(key.tonic).minorRelative)} minor`,
  }
}

const MODE_SUFFIX: Record<Mode, string> = {
  major: 'Major',
  minor: 'minor',
  harmonic: 'harmonic minor',
  melodic: 'melodic minor',
}

export function keyName(key: KeyDef): string {
  return `${prettyNote(key.tonic)} ${MODE_SUFFIX[key.mode]}`
}

export type LabelMode = 'degree' | 'solfege' | 'note'

/** แสดง # และ b เป็นสัญลักษณ์ ♯ ♭ 𝄪 */
export function prettyNote(pc: string): string {
  return pc[0] + pc.slice(1).replace(/##/g, '𝄪').replace(/#/g, '♯').replace(/b/g, '♭')
}

export function noteLabel(note: Pick<ScaleNote, 'degree' | 'pc' | 'solfege'>, mode: LabelMode): string {
  if (mode === 'degree') return String(note.degree)
  if (mode === 'solfege') return note.solfege
  return prettyNote(note.pc)
}

export function signatureText(info: KeyInfo): string {
  if (info.alteration === 0) return 'ไม่มีชาร์ปหรือแฟลต'
  const kind = info.alteration > 0 ? 'ชาร์ป' : 'แฟลต'
  return `${kind} ${Math.abs(info.alteration)} ตัว: ${info.accidentals.map(prettyNote).join(', ')}`
}

export function signatureShort(key: KeyDef): string {
  const { alteration } = keyInfo(key)
  if (alteration === 0) return '–'
  return `${Math.abs(alteration)}${alteration > 0 ? '♯' : '♭'}`
}

/** ช่วงคีย์บอร์ดตั้งแต่ C ที่ต่ำกว่าหรือเท่ากับ low ไปจนถึง B ที่สูงกว่าหรือเท่ากับ high */
export function keyboardRange(low: number, high: number): { from: number; to: number } {
  return { from: low - (low % 12), to: high + (11 - (high % 12)) }
}
