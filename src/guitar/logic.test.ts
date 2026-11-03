import { describe, expect, it } from 'vitest'
import { GUITAR_LEVELS, levelPool, noteAt, positionId } from './fretboard'
import { answerNames, correctFrets, generateGuitarQuestions, isCorrectFret } from './logic'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('generateGuitarQuestions', () => {
  it('ได้จำนวนข้อตามที่ขอ ไม่ซ้ำช่องเดิมติดกัน และอยู่ใน pool', () => {
    const pool = levelPool(GUITAR_LEVELS[2])
    const qs = generateGuitarQuestions(pool, 60, seeded(3))
    expect(qs).toHaveLength(60)
    for (let i = 1; i < qs.length; i++) expect(positionId(qs[i])).not.toBe(positionId(qs[i - 1]))
    for (const q of qs) expect(pool.map(positionId)).toContain(positionId(q))
  })

  it('ช่องที่น้ำหนักมากออกบ่อยกว่า', () => {
    const pool = levelPool(GUITAR_LEVELS[0])
    const qs = generateGuitarQuestions(pool, 3000, seeded(5), (n) => (n.string === 6 ? 5 : 1))
    const count = (s: number) => qs.filter((q) => q.string === s).length
    expect(count(6)).toBeGreaterThan(count(1) * 2)
  })

  it('pool ว่างคืนค่าว่าง', () => {
    expect(generateGuitarQuestions([], 5)).toEqual([])
  })
})

describe('isCorrectFret', () => {
  const question = noteAt(6, 3) // G บนสาย 6

  it('ถูกเมื่อแตะช่องที่เป็นโน้ตเดียวกันบนสายที่ถาม', () => {
    expect(isCorrectFret(question, 6, 3)).toBe(true)
    // G อยู่บนสาย 6 อีกครั้งที่เฟรต 15 (นอกช่วงที่แสดง) แต่กติกาเดียวกัน
    expect(isCorrectFret(question, 6, 15)).toBe(true)
  })

  it('ผิดเมื่อเฟรตผิดหรือสายผิด', () => {
    expect(isCorrectFret(question, 6, 5)).toBe(false)
    expect(isCorrectFret(question, 4, 5)).toBe(false)
  })

  it('สายเปล่า E กับเฟรต 12 ถือว่าถูกทั้งคู่', () => {
    const openE = noteAt(6, 0)
    expect(isCorrectFret(openE, 6, 0)).toBe(true)
    expect(isCorrectFret(openE, 6, 12)).toBe(true)
  })
})

describe('correctFrets', () => {
  it('คืนทุกเฟรตบนสายที่เป็นคำตอบ', () => {
    expect(correctFrets(noteAt(6, 0), 12)).toEqual([0, 12])
    expect(correctFrets(noteAt(5, 3), 12)).toEqual([3])
    expect(correctFrets(noteAt(5, 3), 5)).toEqual([3])
  })
})

describe('answerNames', () => {
  it('ด่านสายเปล่าได้ชื่อโน้ตไม่ซ้ำ เรียงแบบ C D E F G A B', () => {
    expect(answerNames(levelPool(GUITAR_LEVELS[0]))).toEqual(['D', 'E', 'G', 'A', 'B'])
  })

  it('ด่านที่ครอบคลุมได้ครบ 7 ตัว', () => {
    expect(answerNames(levelPool(GUITAR_LEVELS[2]))).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
  })
})

describe('answerNames กับโน้ตติดชาร์ป', () => {
  it('ด่าน 5 ได้ครบ 12 ตัว เรียงตามลำดับเสียง', () => {
    const names = answerNames(levelPool(GUITAR_LEVELS[4]))
    expect(names).toHaveLength(12)
    expect(names.slice(0, 4)).toEqual(['C', 'C#', 'D', 'D#'])
  })
})
