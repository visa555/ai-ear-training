import type { KeyDef } from '../theory/keys'
import { keyId } from './progress'

const STORAGE_KEY = 'ear-training:echo:v1'

type Records = Record<string, number>

/** สถิติแยกตามคีย์และชุดโน้ตที่ใช้ (ด่าน) */
export function echoRecordId(key: KeyDef, degrees: number[]): string {
  return `${keyId(key)}:${degrees.join('')}`
}

function load(): Records {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as unknown
    return data && typeof data === 'object' ? (data as Records) : {}
  } catch {
    return {}
  }
}

export function loadEchoBest(id: string): number {
  const value = load()[id]
  return typeof value === 'number' ? value : 0
}

/** บันทึกถ้าทำลายสถิติเดิม คืนค่า true ถ้าเป็นสถิติใหม่ */
export function saveEchoBest(id: string, longest: number): boolean {
  if (longest <= loadEchoBest(id)) return false
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...load(), [id]: longest }))
  } catch {
    // บันทึกไม่ได้ก็เล่นต่อได้
  }
  return true
}
