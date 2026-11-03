import type { Tally } from '../quiz/generator'
import { isObject, readJSON, removeKey, writeJSON } from './local'

const STORAGE_KEY = 'ear-training:guitar:v1'
const MAX_SESSIONS = 100

/** โหมดการเล่น: หาโน้ตบนคอ / บอกชื่อโน้ตของช่องที่กำหนด / ฟังเสียงแล้วหาบนคอ */
export type GuitarMode = 'find' | 'name' | 'listen'

export interface GuitarSessionRecord {
  /** ISO timestamp */
  at: string
  /** ชื่อด่าน เช่น "ระดับ 2" */
  level: string
  mode: GuitarMode
  correct: number
  total: number
}

export interface GuitarProgress {
  /** "สาย-เฟรต" → ผลสะสม */
  byPosition: Record<string, Tally>
  /** ใหม่สุดอยู่หน้าสุด */
  sessions: GuitarSessionRecord[]
}

/** ผลการตอบหนึ่งข้อ (เก็บแค่ที่ต้องใช้ ไม่ผูกกับ component) */
export interface GuitarResult {
  position: string
  correct: boolean
}

const empty = (): GuitarProgress => ({ byPosition: {}, sessions: [] })
const isGuitarProgress = (data: unknown): data is GuitarProgress =>
  isObject(data) && isObject(data.byPosition) && Array.isArray(data.sessions)

export function loadGuitarProgress(): GuitarProgress {
  return readJSON(STORAGE_KEY, isGuitarProgress, empty)
}

export function recordGuitarSession(
  level: string,
  mode: GuitarMode,
  results: GuitarResult[],
  now = new Date(),
): GuitarProgress {
  const progress = loadGuitarProgress()
  const byPosition = { ...progress.byPosition }
  for (const r of results) {
    const prev = byPosition[r.position] ?? { correct: 0, total: 0 }
    byPosition[r.position] = { correct: prev.correct + (r.correct ? 1 : 0), total: prev.total + 1 }
  }
  const next: GuitarProgress = {
    byPosition,
    sessions: [
      { at: now.toISOString(), level, mode, correct: results.filter((r) => r.correct).length, total: results.length },
      ...progress.sessions,
    ].slice(0, MAX_SESSIONS),
  }
  writeJSON(STORAGE_KEY, next)
  return next
}

export function clearGuitarProgress() {
  removeKey(STORAGE_KEY)
}
