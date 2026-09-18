import type { KeyDef } from '../theory/keys'
import { isObject, readJSON, writeJSON } from './local'
import { keyId } from './progress'

const STORAGE_KEY = 'ear-training:echo:v1'

type Records = Record<string, number>

/** สถิติแยกตามคีย์และชุดโน้ตที่ใช้ (ด่าน) */
export function echoRecordId(key: KeyDef, degrees: number[]): string {
  return `${keyId(key)}:${degrees.join('')}`
}

const load = (): Records => readJSON(STORAGE_KEY, (d): d is Records => isObject(d), () => ({}))

export function loadEchoBest(id: string): number {
  const value = load()[id]
  return typeof value === 'number' ? value : 0
}

/** บันทึกถ้าทำลายสถิติเดิม คืนค่า true ถ้าเป็นสถิติใหม่ */
export function saveEchoBest(id: string, longest: number): boolean {
  if (longest <= loadEchoBest(id)) return false
  writeJSON(STORAGE_KEY, { ...load(), [id]: longest })
  return true
}
