import { describe, expect, it } from 'vitest'
import { cadenceChords } from '../audio/cadence'
import { scaleNotes, type KeyDef } from '../theory/keys'
import {
  buildPool,
  currentStreak,
  degreeWeight,
  generateQuestions,
  resolutionPath,
  starsFor,
  statsByDegree,
} from './generator'

const C: KeyDef = { tonic: 'C', mode: 'major' }
const G: KeyDef = { tonic: 'G', mode: 'major' }

/** rng ที่คาดเดาได้ สำหรับเทสต์ */
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('buildPool', () => {
  it('เลือกเฉพาะขั้นที่กำหนด', () => {
    expect(buildPool(C, [1, 3, 5], 1).map((n) => n.name)).toEqual(['C4', 'E4', 'G4'])
  })

  it('โหมด 2 ออคเทฟมีออคเทฟล่างด้วย', () => {
    expect(buildPool(C, [1], 2).map((n) => n.name)).toEqual(['C3', 'C4'])
  })
})

describe('generateQuestions', () => {
  it('ได้จำนวนข้อตามที่ขอ และมาจาก pool เท่านั้น', () => {
    const pool = buildPool(G, [1, 2, 3, 4, 5, 6, 7], 1)
    const qs = generateQuestions(pool, 50, seeded(1))
    expect(qs).toHaveLength(50)
    for (const q of qs) expect(pool).toContain(q)
  })

  it('ไม่ออกโน้ตเดิมติดกัน', () => {
    const qs = generateQuestions(buildPool(C, [1, 5], 1), 100, seeded(7))
    for (let i = 1; i < qs.length; i++) expect(qs[i].midi).not.toBe(qs[i - 1].midi)
  })

  it('pool ตัวเดียวยังทำงานได้ และ pool ว่างคืนค่าว่าง', () => {
    expect(generateQuestions(buildPool(C, [1], 1), 3)).toHaveLength(3)
    expect(generateQuestions([], 3)).toEqual([])
  })

  // กฎห้ามออกซ้ำติดกันทำให้ขั้นใดขั้นหนึ่งออกได้ไม่เกินราวครึ่งหนึ่ง จึงเทียบแค่ว่าบ่อยกว่าชัดเจน
  it('ขั้นที่มีน้ำหนักมากกว่าออกบ่อยกว่า', () => {
    const pool = buildPool(C, [1, 3, 5], 1)
    const qs = generateQuestions(pool, 3000, seeded(3), (n) => (n.degree === 3 ? 4 : 1))
    const count = (d: number) => qs.filter((q) => q.degree === d).length
    expect(count(3)).toBeGreaterThan(count(1) * 1.4)
    expect(count(3)).toBeGreaterThan(count(5) * 1.4)
  })
})

describe('degreeWeight', () => {
  it('ขั้นที่ผิดบ่อยได้น้ำหนักมากกว่าขั้นที่ถูกตลอด และขั้นที่ยังไม่เคยเจออยู่ตรงกลาง', () => {
    const perfect = degreeWeight({ correct: 10, total: 10 })
    const unseen = degreeWeight(undefined)
    const poor = degreeWeight({ correct: 2, total: 10 })
    expect(perfect).toBeLessThan(unseen)
    expect(unseen).toBeLessThan(poor)
    expect(perfect).toBeGreaterThan(0)
  })
})

describe('resolutionPath', () => {
  const [, re, , fa, sol, , ti] = scaleNotes(C)

  it('ขั้น 1–4 ไล่ลงหาโทนิก', () => {
    expect(resolutionPath(C, fa).map((n) => n.name)).toEqual(['F4', 'E4', 'D4', 'C4'])
    expect(resolutionPath(C, re).map((n) => n.name)).toEqual(['D4', 'C4'])
  })

  it('ขั้น 5–7 ไล่ขึ้นหาโทนิกตัวบน', () => {
    expect(resolutionPath(C, sol).map((n) => n.name)).toEqual(['G4', 'A4', 'B4', 'C5'])
    expect(resolutionPath(C, ti).map((n) => n.name)).toEqual(['B4', 'C5'])
  })

  it('ใช้โน้ตของคีย์ไมเนอร์', () => {
    const Am: KeyDef = { tonic: 'A', mode: 'harmonic' }
    const sixth = scaleNotes(Am)[5]
    expect(resolutionPath(Am, sixth).map((n) => n.name)).toEqual(['F4', 'G#4', 'A4'])
  })
})

describe('statsByDegree', () => {
  it('นับถูก/ทั้งหมดแยกตามขั้น', () => {
    const [c, , e] = scaleNotes(C)
    const stats = statsByDegree([
      { question: e, chosen: 3, correct: true },
      { question: c, chosen: 1, correct: true },
      { question: e, chosen: 5, correct: false },
    ])
    expect(stats).toEqual([
      { degree: 1, correct: 1, total: 1 },
      { degree: 3, correct: 1, total: 2 },
    ])
  })
})

describe('cadenceChords', () => {
  it('C major: I–IV–V–I', () => {
    expect(cadenceChords(60)).toEqual([
      [48, 60, 64, 67],
      [53, 60, 65, 69],
      [55, 59, 62, 67],
      [48, 60, 64, 67],
    ])
  })

  it('C minor: i–iv–V–i (V ยังเป็นเมเจอร์)', () => {
    expect(cadenceChords(60, true)).toEqual([
      [48, 60, 63, 67],
      [53, 60, 65, 68],
      [55, 59, 62, 67],
      [48, 60, 63, 67],
    ])
  })
})

describe('currentStreak / starsFor', () => {
  const [c] = scaleNotes(C)
  const a = (correct: boolean) => ({ question: c, chosen: 1, correct })

  it('นับเฉพาะข้อที่ถูกติดกันตอนท้าย', () => {
    expect(currentStreak([])).toBe(0)
    expect(currentStreak([a(true), a(false), a(true), a(true)])).toBe(2)
    expect(currentStreak([a(true), a(false)])).toBe(0)
  })

  it('ได้อย่างน้อย 1 ดาวเสมอ', () => {
    expect(starsFor(0)).toBe(1)
    expect(starsFor(59)).toBe(1)
    expect(starsFor(60)).toBe(2)
    expect(starsFor(90)).toBe(3)
  })
})
