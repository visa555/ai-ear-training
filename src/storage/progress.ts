import { statsByDegree, type Answer, type Tally } from '../quiz/generator'
import type { KeyDef } from '../theory/keys'
import { isObject, readJSON, removeKey, writeJSON } from './local'

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
const isProgress = (data: unknown): data is Progress =>
  isObject(data) && isObject(data.byKey) && Array.isArray(data.sessions)

export function keyId(key: KeyDef): string {
  return `${key.mode}:${key.tonic}`
}

export function parseKeyId(id: string): KeyDef {
  const [mode, tonic] = id.split(':')
  return { mode: mode as KeyDef['mode'], tonic }
}

export function loadProgress(): Progress {
  return readJSON(STORAGE_KEY, isProgress, empty)
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
  writeJSON(STORAGE_KEY, next)
  return next
}

export function clearProgress() {
  removeKey(STORAGE_KEY)
}
