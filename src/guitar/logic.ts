import { weightedPick } from '../lib/random'
import { CHROMATIC, noteAt, positionId, type FretNote } from './fretboard'

/** สุ่มช่องที่จะถาม โดยไม่ให้ช่องเดิมออกติดกัน */
export function generateGuitarQuestions(
  pool: FretNote[],
  count: number,
  rng: () => number = Math.random,
  weight: (note: FretNote) => number = () => 1,
): FretNote[] {
  if (pool.length === 0) return []
  const questions: FretNote[] = []
  for (let i = 0; i < count; i++) {
    const prev = questions[questions.length - 1]
    const candidates = pool.length > 1 && prev ? pool.filter((n) => positionId(n) !== positionId(prev)) : pool
    questions.push(weightedPick(candidates, weight, rng))
  }
  return questions
}

/**
 * ตอบถูกเมื่อแตะช่องที่เป็นโน้ตเดียวกันบนสายที่ถาม
 * (โน้ตตัวเดียวกันอาจอยู่หลายเฟรตบนสายเดียวกัน เช่น E สาย 6 ที่เฟรต 0 และ 12 ถือว่าถูกทั้งคู่)
 */
export function isCorrectFret(question: FretNote, stringNumber: number, fret: number): boolean {
  return stringNumber === question.string && noteAt(stringNumber, fret).pc === question.pc
}

/** ทุกเฟรตบนสายที่ถามที่เป็นคำตอบที่ถูก (ใช้ไฮไลต์ตอนเฉลย) */
export function correctFrets(question: FretNote, maxFret: number): number[] {
  const frets: number[] = []
  for (let fret = 0; fret <= maxFret; fret++) {
    if (noteAt(question.string, fret).pc === question.pc) frets.push(fret)
  }
  return frets
}

/** ปุ่มคำตอบของเกม “ช่องนี้ชื่ออะไร”: ชื่อโน้ตที่ไม่ซ้ำกันในด่าน เรียงตามลำดับเสียง C → B */
export function answerNames(pool: FretNote[]): string[] {
  const used = new Set(pool.map((n) => n.pc))
  return CHROMATIC.filter((l) => used.has(l))
}
