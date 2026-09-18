import type { Tally } from '../quiz/generator'
import { isObject, readJSON, removeKey, writeJSON } from './local'

const STORAGE_KEY = 'ear-training:reading:v1'
const MAX_SESSIONS = 100

export interface ReadingSessionRecord {
  /** ISO timestamp */
  at: string
  /** ชื่อด่าน เช่น "ระดับ 2" */
  level: string
  correct: number
  total: number
}

export interface ReadingProgress {
  /** ชื่อโน้ต (เช่น "C4") → ผลสะสม */
  byNote: Record<string, Tally>
  /** ใหม่สุดอยู่หน้าสุด */
  sessions: ReadingSessionRecord[]
}

/** ผลการอ่านหนึ่งข้อ (เก็บแค่ที่ต้องใช้ ไม่ผูกกับ component) */
export interface ReadingResult {
  note: string
  correct: boolean
}

const empty = (): ReadingProgress => ({ byNote: {}, sessions: [] })
const isReadingProgress = (data: unknown): data is ReadingProgress =>
  isObject(data) && isObject(data.byNote) && Array.isArray(data.sessions)

export function loadReadingProgress(): ReadingProgress {
  return readJSON(STORAGE_KEY, isReadingProgress, empty)
}

export function recordReadingSession(level: string, results: ReadingResult[], now = new Date()): ReadingProgress {
  const progress = loadReadingProgress()
  const byNote = { ...progress.byNote }
  for (const r of results) {
    const prev = byNote[r.note] ?? { correct: 0, total: 0 }
    byNote[r.note] = { correct: prev.correct + (r.correct ? 1 : 0), total: prev.total + 1 }
  }
  const next: ReadingProgress = {
    byNote,
    sessions: [
      { at: now.toISOString(), level, correct: results.filter((r) => r.correct).length, total: results.length },
      ...progress.sessions,
    ].slice(0, MAX_SESSIONS),
  }
  writeJSON(STORAGE_KEY, next)
  return next
}

export function clearReadingProgress() {
  removeKey(STORAGE_KEY)
}
