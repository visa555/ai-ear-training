import { statsByDegree, type Answer, type Tally } from '../quiz/generator'
import type { KeyDef } from '../theory/keys'

const STORAGE_KEY = 'ear-training:progress:v1'
const MAX_SESSIONS = 100

export interface SessionRecord {
  /** ISO timestamp */
  at: string
  key: KeyDef
  correct: number
  total: number
}

export interface Progress {
  /** keyId → degree → ผลสะสม */
  byKey: Record<string, Record<number, Tally>>
  /** ใหม่สุดอยู่หน้าสุด */
  sessions: SessionRecord[]
}

const empty = (): Progress => ({ byKey: {}, sessions: [] })

export function keyId(key: KeyDef): string {
  return `${key.mode}:${key.tonic}`
}

export function parseKeyId(id: string): KeyDef {
  const [mode, tonic] = id.split(':')
  return { mode: mode as KeyDef['mode'], tonic }
}

/** localStorage อาจใช้ไม่ได้ (private mode, ถูกบล็อก) จึงต้องไม่ทำให้แอปพัง */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return empty()
    const data = JSON.parse(raw) as Partial<Progress>
    if (typeof data.byKey !== 'object' || !Array.isArray(data.sessions)) return empty()
    return { byKey: data.byKey ?? {}, sessions: data.sessions }
  } catch {
    return empty()
  }
}

function save(progress: Progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // ไม่มีที่เก็บก็ใช้งานต่อได้ เพียงแต่ไม่มีสถิติสะสม
  }
}

export function recordSession(key: KeyDef, answers: Answer[], now = new Date()): Progress {
  const progress = loadProgress()
  const id = keyId(key)
  const tallies = { ...progress.byKey[id] }
  for (const s of statsByDegree(answers)) {
    const prev = tallies[s.degree] ?? { correct: 0, total: 0 }
    tallies[s.degree] = { correct: prev.correct + s.correct, total: prev.total + s.total }
  }
  const next: Progress = {
    byKey: { ...progress.byKey, [id]: tallies },
    sessions: [
      { at: now.toISOString(), key, correct: answers.filter((a) => a.correct).length, total: answers.length },
      ...progress.sessions,
    ].slice(0, MAX_SESSIONS),
  }
  save(next)
  return next
}

export function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}
