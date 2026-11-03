import { describe, expect, it } from 'vitest'
import { CHROMATIC, GUITAR_LEVELS, levelPool, MAX_FRET, noteAt, positionId, positionsOf, STRINGS } from './fretboard'

describe('STRINGS', () => {
  it('ตั้งสายมาตรฐาน E A D G B E โดยสาย 1 เป็น E สูง', () => {
    expect(STRINGS.map((s) => s.open)).toEqual(['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])
  })

  it('สาย 1 สูงกว่าสาย 6 สองออคเทฟ', () => {
    expect(noteAt(1, 0).midi - noteAt(6, 0).midi).toBe(24)
  })
})

describe('noteAt', () => {
  it('สายเปล่าและเฟรตต่างๆ', () => {
    expect(noteAt(6, 0).name).toBe('E2')
    expect(noteAt(6, 5).name).toBe('A2')
    expect(noteAt(5, 3).name).toBe('C3')
    expect(noteAt(1, 12).name).toBe('E5')
  })

  it('แยกโน้ตธรรมชาติกับโน้ตติดชาร์ป', () => {
    expect(noteAt(6, 1)).toMatchObject({ pc: 'F', natural: true })
    expect(noteAt(6, 2)).toMatchObject({ pc: 'F#', natural: false })
  })

  it('เฟรต 12 เสียงสูงกว่าสายเปล่า 1 ออคเทฟ และชื่อเดิม', () => {
    for (const s of STRINGS) {
      const open = noteAt(s.number, 0)
      const twelfth = noteAt(s.number, MAX_FRET)
      expect(twelfth.pc).toBe(open.pc)
      expect(twelfth.midi - open.midi).toBe(12)
    }
  })

  it('รูปทรงจำโน้ต: ข้ามไป 2 สายที่เล็กกว่า แล้วขยับ 2 เฟรต ได้ชื่อโน้ตเดิม', () => {
    expect(noteAt(4, 5).pc).toBe(noteAt(6, 3).pc)
    expect(noteAt(3, 4).pc).toBe(noteAt(5, 2).pc)
  })
})

describe('positionsOf', () => {
  it('หาโน้ต C ในเฟรต 0–5 ได้ครบทุกสาย', () => {
    expect(positionsOf('C', 5).map(positionId)).toEqual(['2-1', '3-5', '5-3'])
  })

  it('สาย 1 กับสาย 6 มีชื่อโน้ตตรงกันทุกเฟรต', () => {
    for (let fret = 0; fret <= MAX_FRET; fret++) {
      expect(noteAt(1, fret).pc).toBe(noteAt(6, fret).pc)
    }
  })
})

describe('GUITAR_LEVELS', () => {
  it('ด่าน 1 คือสายเปล่า 6 ช่อง', () => {
    const pool = levelPool(GUITAR_LEVELS[0])
    expect(pool).toHaveLength(6)
    expect(pool.every((n) => n.fret === 0)).toBe(true)
  })

  it('ด่าน 2 ใช้สาย 6 กับ 1 เฉพาะโน้ตธรรมชาติ', () => {
    const pool = levelPool(GUITAR_LEVELS[1])
    expect(new Set(pool.map((n) => n.string))).toEqual(new Set([1, 6]))
    expect(pool.every((n) => n.natural)).toBe(true)
    // E F G A ในเฟรต 0–5 ของแต่ละสาย (เฟรต 0, 1, 3, 5)
    expect(pool.filter((n) => n.string === 6).map((n) => n.fret)).toEqual([0, 1, 3, 5])
  })

  it('ด่าน 4 ใช้เฟรต 0–12 และแสดงคอทั้ง 12 เฟรต', () => {
    const level = GUITAR_LEVELS[3]
    expect(level.frets).toEqual([0, 12])
    expect(level.showFrets).toBe(12)
    const pool = levelPool(level)
    expect(pool.every((n) => n.natural)).toBe(true)
    // สาย 6 มีโน้ตธรรมชาติ 8 ตัวในเฟรต 0–12 (E F G A B C D E)
    expect(pool.filter((n) => n.string === 6).map((n) => n.pc)).toEqual(['E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'])
  })

  it('ด่าน 3 ครบ 6 สาย และไม่มีโน้ตติดชาร์ป', () => {
    const pool = levelPool(GUITAR_LEVELS[2])
    expect(new Set(pool.map((n) => n.string)).size).toBe(6)
    expect(pool.every((n) => n.natural)).toBe(true)
    expect(pool.length).toBeGreaterThan(20)
  })
})

describe('ด่านโน้ตติดชาร์ป', () => {
  const level = GUITAR_LEVELS[4]

  it('ด่าน 5 รวมโน้ตติดชาร์ป และมีครบทุกช่องของ 6 สาย เฟรต 0–12', () => {
    expect(level.accidentals).toBe(true)
    const pool = levelPool(level)
    expect(pool).toHaveLength(6 * 13)
    expect(pool.some((n) => !n.natural)).toBe(true)
  })

  it('โน้ตติดชาร์ปใช้สีของตัวอักษรหน้ามัน', () => {
    const fSharp = noteAt(6, 2)
    expect(fSharp.pc).toBe('F#')
    expect(fSharp.letterIndex).toBe(noteAt(6, 1).letterIndex)
  })

  it('CHROMATIC เรียงตามลำดับเสียงครบ 12 ตัว', () => {
    expect(CHROMATIC).toHaveLength(12)
    expect(CHROMATIC[0]).toBe('C')
    expect(CHROMATIC.filter((n) => n.includes('#'))).toHaveLength(5)
  })
})
