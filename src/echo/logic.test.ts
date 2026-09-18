import { describe, expect, it } from 'vitest'
import { buildPool } from '../quiz/generator'
import type { KeyDef } from '../theory/keys'
import { checkInput, echoStars, extendSequence, START_LENGTH, startSequence } from './logic'

const C: KeyDef = { tonic: 'C', mode: 'major' }
const pool = buildPool(C, [1, 3, 5], 1)
const [doNote, mi, sol] = pool

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('checkInput', () => {
  const seq = [doNote, sol, mi]

  it('ถูกแต่ยังไม่ครบ → next, ถูกตัวสุดท้าย → complete', () => {
    expect(checkInput(seq, 0, 1)).toBe('next')
    expect(checkInput(seq, 1, 5)).toBe('next')
    expect(checkInput(seq, 2, 3)).toBe('complete')
  })

  it('กดผิดหรือกดเกิน → wrong', () => {
    expect(checkInput(seq, 0, 3)).toBe('wrong')
    expect(checkInput(seq, 3, 1)).toBe('wrong')
  })
})

describe('sequence', () => {
  it('เริ่มที่ความยาวตั้งต้น และต่อทีละหนึ่งโน้ตโดยคงของเดิมไว้', () => {
    const start = startSequence(pool, seeded(1))
    expect(start).toHaveLength(START_LENGTH)
    const next = extendSequence(start, pool, seeded(2))
    expect(next).toHaveLength(START_LENGTH + 1)
    expect(next.slice(0, START_LENGTH)).toEqual(start)
  })

  it('ไม่มีโน้ตเดียวกันติดกัน และใช้แต่โน้ตใน pool', () => {
    let seq = startSequence(pool, seeded(5))
    const rng = seeded(9)
    for (let i = 0; i < 40; i++) seq = extendSequence(seq, pool, rng)
    for (let i = 1; i < seq.length; i++) expect(seq[i].degree).not.toBe(seq[i - 1].degree)
    for (const n of seq) expect(pool).toContain(n)
  })
})

describe('echoStars', () => {
  it('ได้อย่างน้อย 1 ดาวเสมอ', () => {
    expect(echoStars(0)).toBe(1)
    expect(echoStars(3)).toBe(1)
    expect(echoStars(4)).toBe(2)
    expect(echoStars(6)).toBe(3)
  })
})
