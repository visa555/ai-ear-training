import { beforeEach, describe, expect, it, vi } from 'vitest'
import { scaleNotes, type KeyDef } from '../theory/keys'
import { clearProgress, keyId, loadProgress, parseKeyId, recordSession } from './progress'

const C: KeyDef = { tonic: 'C', mode: 'major' }
const [c, , e] = scaleNotes(C)

function memoryStorage() {
  const data = new Map<string, string>()
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
})

describe('progress', () => {
  it('ยังไม่มีข้อมูลคืนค่าว่าง', () => {
    expect(loadProgress()).toEqual({ byKey: {}, sessions: [] })
  })

  it('บันทึกและสะสมผลหลายรอบ', () => {
    recordSession(C, [
      { question: c, chosen: 1, correct: true },
      { question: e, chosen: 5, correct: false },
    ])
    recordSession(C, [{ question: e, chosen: 3, correct: true }])

    const p = loadProgress()
    expect(p.byKey[keyId(C)]).toEqual({ 1: { correct: 1, total: 1 }, 3: { correct: 1, total: 2 } })
    expect(p.sessions).toHaveLength(2)
    expect(p.sessions[0]).toMatchObject({ correct: 1, total: 1, key: C })
  })

  it('ล้างข้อมูลได้', () => {
    recordSession(C, [{ question: c, chosen: 1, correct: true }])
    clearProgress()
    expect(loadProgress().sessions).toEqual([])
  })

  it('ข้อมูลเสียหรือ localStorage ใช้ไม่ได้ ไม่ทำให้พัง', () => {
    localStorage.setItem('ear-training:progress:v1', '{not json')
    expect(loadProgress()).toEqual({ byKey: {}, sessions: [] })

    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadProgress().sessions).toEqual([])
    expect(() => recordSession(C, [{ question: c, chosen: 1, correct: true }])).not.toThrow()
    expect(() => clearProgress()).not.toThrow()
  })

  it('keyId แปลงกลับได้', () => {
    const key: KeyDef = { tonic: 'F#', mode: 'harmonic' }
    expect(parseKeyId(keyId(key))).toEqual(key)
  })
})
