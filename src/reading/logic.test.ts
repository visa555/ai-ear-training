import { describe, expect, it } from 'vitest'
import { ledgerLines, staffNote } from '../notation/staff'
import {
  answerLetters,
  generateReadingQuestions,
  isCorrectLetter,
  READING_LEVELS,
  readingKeyboardRange,
} from './logic'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('READING_LEVELS', () => {
  it('ด่านต่างๆ มีโน้ตตามที่ออกแบบ', () => {
    expect(READING_LEVELS[0].notes).toEqual(['C4', 'E4', 'G4'])
    expect(READING_LEVELS[1].notes).toEqual(['C4', 'D4', 'E4', 'F4', 'G4'])
    expect(READING_LEVELS[2].notes).toHaveLength(8)
  })

  it('ด่าน 4 มีโน้ตเส้นน้อยทั้งใต้และเหนือบรรทัด', () => {
    const notes = READING_LEVELS[3].notes
    expect(notes[0]).toBe('A3')
    expect(notes[notes.length - 1]).toBe('A5')
    expect(notes).toHaveLength(15)
    const withLedger = notes.filter((n) => ledgerLines(staffNote(n).pos).length > 0)
    expect(withLedger).toEqual(['A3', 'B3', 'C4', 'A5'])
  })
})

describe('generateReadingQuestions', () => {
  it('ได้จำนวนข้อตามที่ขอ ไม่ซ้ำติดกัน และอยู่ใน pool', () => {
    const pool = READING_LEVELS[2].notes
    const qs = generateReadingQuestions(pool, 60, seeded(4))
    expect(qs).toHaveLength(60)
    for (let i = 1; i < qs.length; i++) expect(qs[i].name).not.toBe(qs[i - 1].name)
    for (const q of qs) expect(pool).toContain(q.name)
  })

  it('โน้ตที่มีน้ำหนักมากออกบ่อยกว่า', () => {
    const qs = generateReadingQuestions(['C4', 'E4', 'G4'], 3000, seeded(8), (n) => (n.name === 'E4' ? 4 : 1))
    const count = (name: string) => qs.filter((q) => q.name === name).length
    expect(count('E4')).toBeGreaterThan(count('C4') * 1.4)
    expect(count('E4')).toBeGreaterThan(count('G4') * 1.4)
  })

  it('pool ว่างคืนค่าว่าง', () => {
    expect(generateReadingQuestions([], 5)).toEqual([])
  })
})

describe('answers', () => {
  it('ปุ่มคำตอบไม่ซ้ำและเรียงตามตัวอักษรดนตรี', () => {
    expect(answerLetters(['G4', 'C4', 'E4'])).toEqual(['C', 'E', 'G'])
    expect(answerLetters(READING_LEVELS[2].notes)).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })

  it('เทียบเฉพาะชื่อตัวอักษร', () => {
    expect(isCorrectLetter(staffNote('C5'), 'C')).toBe(true)
    expect(isCorrectLetter(staffNote('E4'), 'F')).toBe(false)
  })
})

describe('readingKeyboardRange', () => {
  it('อย่างน้อย C4–B5 และขยายลงไปถึงโน้ตต่ำสุด', () => {
    expect(readingKeyboardRange(READING_LEVELS[0].notes)).toEqual({ from: 60, to: 83 })
    expect(readingKeyboardRange(READING_LEVELS[3].notes)).toEqual({ from: 57, to: 83 })
  })
})
