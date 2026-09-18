import { weightedPick } from '../lib/random'
import { LETTERS, naturalRange, staffNote, type StaffNote } from '../notation/staff'

export const READING_LEVELS: { icon: string; name: string; hint: string; notes: string[] }[] = [
  { icon: '🐣', name: 'ระดับ 1', hint: 'โด มี ซอล', notes: ['C4', 'E4', 'G4'] },
  { icon: '🐥', name: 'ระดับ 2', hint: '5 นิ้ว (C–G)', notes: naturalRange('C4', 'G4').map((n) => n.name) },
  { icon: '🦅', name: 'ระดับ 3', hint: '1 ออคเทฟ (C–C)', notes: naturalRange('C4', 'C5').map((n) => n.name) },
  { icon: '🚀', name: 'ระดับ 4', hint: 'เส้นน้อย (A–A)', notes: naturalRange('A3', 'A5').map((n) => n.name) },
]

/** สุ่มโน้ตให้อ่าน โดยไม่ให้ตัวเดิมออกติดกัน และให้ตัวที่มีน้ำหนักมากออกบ่อยกว่า */
export function generateReadingQuestions(
  pool: string[],
  count: number,
  rng: () => number = Math.random,
  weight: (note: StaffNote) => number = () => 1,
): StaffNote[] {
  if (pool.length === 0) return []
  const notes = pool.map(staffNote)
  const questions: StaffNote[] = []
  for (let i = 0; i < count; i++) {
    const prev = questions[questions.length - 1]
    const candidates = notes.length > 1 && prev ? notes.filter((n) => n.name !== prev.name) : notes
    questions.push(weightedPick(candidates, weight, rng))
  }
  return questions
}

/** ปุ่มคำตอบ: ตัวอักษรที่ไม่ซ้ำกันใน pool เรียง C → B */
export function answerLetters(pool: string[]): string[] {
  const used = new Set(pool.map((n) => staffNote(n).letter))
  return LETTERS.filter((l) => used.has(l))
}

/** เทียบเฉพาะชื่อตัวอักษร (C4 กับ C5 ถือว่าชื่อถูก) */
export function isCorrectLetter(target: StaffNote, letter: string): boolean {
  return target.letter === letter
}

/** ช่วงคีย์เปียโนของเกม: อย่างน้อย C4–B5 และขยายลงไปให้ครอบโน้ตต่ำสุดของด่าน */
export function readingKeyboardRange(pool: string[]): { from: number; to: number } {
  const midis = pool.map((n) => staffNote(n).midi)
  return { from: Math.min(60, ...midis), to: Math.max(83, ...midis) }
}
