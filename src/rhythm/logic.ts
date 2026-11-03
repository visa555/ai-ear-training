import { weightedPick } from '../lib/random'
import { RHYTHMS, type RhythmValue } from './values'

/** ความเร็วเริ่มต้น (จังหวะต่อนาที): ช้าพอให้เด็กนับทัน ตัวกลมยาว 3 วินาที */
export const DEFAULT_BPM = 80
/** นับนำก่อนเล่นโน้ต 1 ห้อง */
export const COUNT_IN = 4
/** ห้องที่มีโน้ตคำถาม (4/4) */
export const MEASURE_BEATS = 4
/** เว้นช่องว่างท้ายโน้ตเล็กน้อยให้ได้ยินว่าเสียงหยุดตรงไหน */
const ARTICULATION = 0.9

export const RHYTHM_LEVELS: { icon: string; name: string; values: RhythmValue[] }[] = [
  { icon: '🐣', name: 'ระดับ 1', values: ['whole', 'quarter'] },
  { icon: '🐥', name: 'ระดับ 2', values: ['whole', 'half', 'quarter'] },
  { icon: '🦅', name: 'ระดับ 3', values: ['whole', 'half', 'quarter', 'eighths'] },
  { icon: '🚀', name: 'ระดับ 4', values: ['whole', 'dottedHalf', 'half', 'quarter'] },
  { icon: '👑', name: 'ระดับ 5', values: ['whole', 'dottedHalf', 'half', 'dottedQuarter', 'quarter', 'eighths'] },
]

/** สุ่มคำถาม ไม่ให้ตัวเดิมออกติดกัน และตัวที่น้ำหนักมากออกบ่อยกว่า */
export function generateRhythmQuestions(
  pool: RhythmValue[],
  count: number,
  rng: () => number = Math.random,
  weight: (value: RhythmValue) => number = () => 1,
): RhythmValue[] {
  if (pool.length === 0) return []
  const questions: RhythmValue[] = []
  for (let i = 0; i < count; i++) {
    const prev = questions[questions.length - 1]
    const candidates = pool.length > 1 && prev ? pool.filter((v) => v !== prev) : pool
    questions.push(weightedPick(candidates, weight, rng))
  }
  return questions
}

export interface BeatTick {
  /** วินาทีนับจากเริ่มเล่น */
  time: number
  /** 'count' = นับนำ, 'measure' = ห้องที่มีโน้ต */
  phase: 'count' | 'measure'
  /** จังหวะที่เท่าไรในช่วงนั้น (เริ่มที่ 0) */
  beat: number
  /** เล่นเสียงเคาะไหม (นับนำเคาะเสมอ ห้องโน้ตเคาะตามตัวเลือก) */
  click: boolean
  /** จังหวะแรกของห้องเคาะหนักกว่า */
  accent: boolean
}

/** สถานะก่อนเสียงแรกจะดัง (ระหว่างเตรียมเสียง) ใช้ไม่ให้ภาพเฉลยความยาวล่วงหน้า */
export const PENDING_TICK: BeatTick = { time: 0, phase: 'count', beat: -1, click: false, accent: false }

export interface ScheduledSound {
  time: number
  duration: number
}

export interface RhythmSchedule {
  beats: BeatTick[]
  sounds: ScheduledSound[]
  /** ความยาวทั้งหมด (วินาที) */
  total: number
}

export interface ScheduleInput {
  value: RhythmValue
  bpm?: number
  /** เคาะจังหวะต่อระหว่างโน้ตดังไหม */
  clicks: boolean
}

/** คำนวณเวลาของเสียงเคาะและเสียงโน้ตทั้งหมด (ฟังก์ชันล้วน ใช้ทั้งเล่นเสียงและทดสอบ) */
export function buildRhythmSchedule({ value, bpm = DEFAULT_BPM, clicks }: ScheduleInput): RhythmSchedule {
  const spb = 60 / bpm
  const beats: BeatTick[] = []
  for (let i = 0; i < COUNT_IN; i++) {
    beats.push({ time: i * spb, phase: 'count', beat: i, click: true, accent: i === 0 })
  }
  for (let i = 0; i < MEASURE_BEATS; i++) {
    beats.push({ time: (COUNT_IN + i) * spb, phase: 'measure', beat: i, click: clicks, accent: i === 0 })
  }
  const sounds = RHYTHMS[value].sounds.map((s) => ({
    time: (COUNT_IN + s.beat) * spb,
    duration: s.beats * spb * ARTICULATION,
  }))
  return { beats, sounds, total: (COUNT_IN + MEASURE_BEATS) * spb }
}

/** ช่วงที่ระบายสีในวงกลมจังหวะหนึ่งวง (0–1 = ต้นจนท้ายจังหวะ) */
export interface BeatSegment {
  from: number
  to: number
  /** เสียงใหม่เริ่มตรงจุดนี้กลางจังหวะ (วาดเส้นคั่นให้เห็นว่ามีเสียงใหม่) */
  onset: boolean
}

/** ส่วนของจังหวะที่ beatIndex ที่มีเสียงโน้ตดังอยู่ ใช้ระบายวงกลมให้ตรงความยาวจริง (รวมครึ่งจังหวะ) */
export function beatCoverage(value: RhythmValue, beatIndex: number): BeatSegment[] {
  const segments: BeatSegment[] = []
  for (const s of RHYTHMS[value].sounds) {
    const from = Math.max(s.beat, beatIndex) - beatIndex
    const to = Math.min(s.beat + s.beats, beatIndex + 1) - beatIndex
    if (to > from) segments.push({ from, to, onset: s.beat > beatIndex && s.beat < beatIndex + 1 })
  }
  return segments
}
