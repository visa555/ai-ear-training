import type { ScaleNote } from '../theory/keys'

/** ทำนองรอบแรกยาวกี่โน้ต */
export const START_LENGTH = 2
/** จำนวนหัวใจต่อเกม */
export const MAX_HEARTS = 3

export type InputResult = 'next' | 'complete' | 'wrong'

/** ตรวจโน้ตที่เด็กกด (เทียบตามขั้น ไม่สนออคเทฟ) */
export function checkInput(sequence: ScaleNote[], index: number, degree: number): InputResult {
  if (sequence[index]?.degree !== degree) return 'wrong'
  return index + 1 === sequence.length ? 'complete' : 'next'
}

/** ต่อทำนองอีกหนึ่งโน้ต โดยไม่ให้ซ้ำกับโน้ตสุดท้าย (ฟังง่ายกว่าสำหรับเด็ก) */
export function extendSequence(
  sequence: ScaleNote[],
  pool: ScaleNote[],
  rng: () => number = Math.random,
): ScaleNote[] {
  const last = sequence[sequence.length - 1]
  const candidates = pool.length > 1 && last ? pool.filter((n) => n.degree !== last.degree) : pool
  return [...sequence, candidates[Math.floor(rng() * candidates.length)]]
}

export function startSequence(pool: ScaleNote[], rng: () => number = Math.random): ScaleNote[] {
  let sequence: ScaleNote[] = []
  for (let i = 0; i < START_LENGTH; i++) sequence = extendSequence(sequence, pool, rng)
  return sequence
}

/** ดาวตามความยาวทำนองที่จำได้ยาวที่สุด: เล่นจบได้อย่างน้อย 1 ดาวเสมอ */
export function echoStars(longest: number): 1 | 2 | 3 {
  if (longest >= 6) return 3
  if (longest >= 4) return 2
  return 1
}
