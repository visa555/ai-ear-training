import { scaleNotes, type KeyDef, type LabelMode, type ScaleNote } from '../theory/keys'

export interface QuizConfig {
  key: KeyDef
  degrees: number[]
  octaves: 1 | 2
  count: number
  labelMode: LabelMode
  /** เล่น cadence ก่อนทุกข้อ (ถ้าปิด จะเล่นเฉพาะข้อแรก) */
  cadenceEvery: boolean
  /** สุ่มขั้นที่เคยตอบผิดบ่อยให้ออกบ่อยขึ้น */
  adaptive: boolean
}

export interface Answer {
  question: ScaleNote
  chosen: number
  correct: boolean
}

export interface Tally {
  correct: number
  total: number
}

/** โน๊ตทั้งหมดที่สุ่มได้ โหมด 2 ออคเทฟจะเพิ่มออคเทฟที่ต่ำลงมา */
export function buildPool(key: KeyDef, degrees: number[], octaves: 1 | 2): ScaleNote[] {
  const shifts = octaves === 2 ? [-1, 0] : [0]
  return shifts.flatMap((s) => scaleNotes(key, s)).filter((n) => degrees.includes(n.degree))
}

/**
 * น้ำหนักการสุ่มของแต่ละขั้นจากสถิติเดิม ใช้อัตราผิดแบบ smoothing (+1/+2)
 * ขั้นที่ยังไม่เคยเจอได้น้ำหนักกลางๆ (2) ตอบถูกตลอดเหลือราว 0.75 ตอบผิดตลอดขึ้นไปราว 3.25
 */
export function degreeWeight(tally: Tally | undefined): number {
  const correct = tally?.correct ?? 0
  const total = tally?.total ?? 0
  return 0.5 + (3 * (total - correct + 1)) / (total + 2)
}

function weightedPick<T>(items: T[], weight: (item: T) => number, rng: () => number): T {
  const weights = items.map(weight)
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}

/** สุ่มคำถาม โดยไม่ให้โน๊ตเดียวกันออกติดกันสองข้อ (ถ้ามีตัวเลือกมากกว่าหนึ่ง) */
export function generateQuestions(
  pool: ScaleNote[],
  count: number,
  rng: () => number = Math.random,
  weight: (note: ScaleNote) => number = () => 1,
): ScaleNote[] {
  if (pool.length === 0) return []
  const questions: ScaleNote[] = []
  for (let i = 0; i < count; i++) {
    const prev = questions[questions.length - 1]
    const candidates = pool.length > 1 && prev ? pool.filter((n) => n.midi !== prev.midi) : pool
    questions.push(weightedPick(candidates, weight, rng))
  }
  return questions
}

/**
 * ไล่โน๊ตจากคำตอบกลับไปหาโทนิกที่ใกล้ที่สุด:
 * ขั้น 1–4 ไล่ลงไปหาโทนิกตัวล่าง ขั้น 5–7 ไล่ขึ้นไปหาโทนิกตัวบน
 */
export function resolutionPath(key: KeyDef, note: ScaleNote): ScaleNote[] {
  const ladder = [-2, -1, 0, 1, 2].flatMap((s) => scaleNotes(key, s))
  const idx = ladder.findIndex((n) => n.midi === note.midi)
  if (idx < 0) return [note]
  return note.degree <= 4
    ? ladder.slice(idx - (note.degree - 1), idx + 1).reverse()
    : ladder.slice(idx, idx + (8 - note.degree) + 1)
}

export interface DegreeStat extends Tally {
  degree: number
}

export function statsByDegree(answers: Answer[]): DegreeStat[] {
  const map = new Map<number, DegreeStat>()
  for (const a of answers) {
    const d = a.question.degree
    const stat = map.get(d) ?? { degree: d, correct: 0, total: 0 }
    stat.total++
    if (a.correct) stat.correct++
    map.set(d, stat)
  }
  return [...map.values()].sort((a, b) => a.degree - b.degree)
}
