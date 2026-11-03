import { Note } from '@tonaljs/tonal'
import { describe, expect, it } from 'vitest'
import { noteAt } from '../guitar/fretboard'
import { scaleNotes, type KeyDef } from '../theory/keys'
import {
  allScalePositions,
  anchorTonic,
  ascendingOrder,
  buildAllPatterns,
  buildPattern,
  CAGED_ORDER,
  relativeKey,
  SCALE_KEYS,
  SCALE_MAX_FRET,
  type CagedShape,
  type ScalePattern,
} from './patterns'

const C: KeyDef = { tonic: 'C', mode: 'major' }
const Am: KeyDef = { tonic: 'A', mode: 'minor' }
const chroma = (pc: string) => Note.chroma(pc)!
const ids = (p: ScalePattern) => p.positions.map((n) => `${n.string}-${n.fret}`)
/** โน้ตของแต่ละสาย เขียนเป็น "ชื่อโน้ต+เฟรต" เรียงตามเฟรต */
const byString = (p: ScalePattern) =>
  Object.fromEntries(
    [6, 5, 4, 3, 2, 1].map((s) => [
      s,
      p.positions
        .filter((n) => n.string === s)
        .sort((a, b) => a.fret - b.fret)
        .map((n) => `${n.pc}${n.fret}`)
        .join(' '),
    ]),
  )

/**
 * ชาร์ตอ้างอิง “C Major – 5 Positions – CAGED” (Jens Larsen)
 * อ่านตำแหน่งจุดจากภาพแล้วตรวจกับทฤษฎีว่าเป็นโน้ตในคีย์ C ทุกจุด
 */
const CHART: Record<CagedShape, Record<number, string>> = {
  A: { 6: 'G3 A5', 5: 'B2 C3 D5', 4: 'E2 F3 G5', 3: 'A2 B4 C5', 2: 'D3 E5 F6', 1: 'G3 A5' },
  G: { 6: 'A5 B7 C8', 5: 'D5 E7 F8', 4: 'G5 A7', 3: 'B4 C5 D7', 2: 'E5 F6 G8', 1: 'A5 B7 C8' },
  E: { 6: 'B7 C8 D10', 5: 'E7 F8 G10', 4: 'A7 B9 C10', 3: 'D7 E9 F10', 2: 'G8 A10', 1: 'B7 C8 D10' },
  D: { 6: 'D10 E12 F13', 5: 'G10 A12', 4: 'B9 C10 D12', 3: 'E9 F10 G12', 2: 'A10 B12 C13', 1: 'D10 E12 F13' },
  C: { 6: 'E12 F13 G15', 5: 'A12 B14 C15', 4: 'D12 E14 F15', 3: 'G12 A14', 2: 'B12 C13 D15', 1: 'E12 F13 G15' },
}

describe('ตรงกับชาร์ต CAGED อ้างอิง (C Major)', () => {
  for (const [shape, expected] of Object.entries(CHART)) {
    it(`รูป ${shape} ตรงกับชาร์ตทุกสาย`, () => {
      expect(byString(buildPattern(C, shape as CagedShape))).toEqual(expected)
    })
  }
})

describe('เสียงซ้ำระหว่างสาย 3 กับสาย 2', () => {
  it('เลือกเล่นตัวที่เฟรตต่ำกว่า (สาย 2) เหมือนสเกล C ตำแหน่งเปิด', () => {
    // F# สาย 3 เฟรต 11 กับ F# สาย 2 เฟรต 7 คือเสียงเดียวกัน ชาร์ตเลือกสาย 2
    const p = buildPattern({ tonic: 'G', mode: 'major' }, 'C')
    const per = byString(p)
    expect(per[3]).toBe('D7 E9')
    expect(per[2]).toBe('F#7 G8 A10')
    const midis = p.positions.map((n) => n.midi)
    expect(new Set(midis).size).toBe(midis.length)
  })
})

describe('โครงสร้างของแพทเทิร์น', () => {
  it('มี 5 รูป เรียงตามวงจร CAGED', () => {
    expect(CAGED_ORDER).toEqual(['C', 'A', 'G', 'E', 'D'])
  })

  it('ทุกรูปมี 16-17 โน้ต สายละ 2-3 โน้ต', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        const pattern = buildPattern(key, shape)
        const counts = [6, 5, 4, 3, 2, 1].map((s) => pattern.positions.filter((n) => n.string === s).length)
        const label = `${key.tonic} รูป ${shape}`
        expect(Math.min(...counts), label).toBeGreaterThanOrEqual(2)
        expect(Math.max(...counts), label).toBeLessThanOrEqual(3)
        expect(pattern.positions.length, label).toBeGreaterThanOrEqual(16)
        expect(pattern.positions.length, label).toBeLessThanOrEqual(17)
      }
    }
  })

  it('ไม่ใช้สายเปล่าเลย แพทเทิร์นจึงเลื่อนไปคีย์อื่นได้', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        const p = buildPattern(key, shape)
        expect(p.positions.filter((n) => n.fret === 0), `${key.tonic} รูป ${shape}`).toEqual([])
      }
    }
  })

  it('มือกางไม่เกิน 5 เฟรต และอยู่บนคอที่แสดงได้', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        const p = buildPattern(key, shape)
        expect(p.to - p.from).toBeLessThanOrEqual(4)
        expect(p.from).toBeGreaterThanOrEqual(0)
        expect(p.to).toBeLessThanOrEqual(SCALE_MAX_FRET)
      }
    }
  })

  it('ทุกโน้ตอยู่ในสเกลจริง และไล่เสียงสูงขึ้นเรื่อยๆ ไม่ย้อนกลับ', () => {
    for (const key of SCALE_KEYS) {
      const inScale = new Set(scaleNotes(key).map((n) => chroma(n.pc)))
      for (const shape of CAGED_ORDER) {
        const p = buildPattern(key, shape)
        for (const pos of p.positions) expect(inScale.has(chroma(noteAt(pos.string, pos.fret).pc))).toBe(true)
        const midis = p.positions.map((n) => n.midi)
        expect(midis).toEqual([...midis].sort((a, b) => a - b))
      }
    }
  })

  it('ทุกรูปมีโน้ตรูทอย่างน้อยหนึ่งจุด', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        expect(buildPattern(key, shape).positions.some((n) => n.root), `${key.tonic} ${shape}`).toBe(true)
      }
    }
  })

  it('แพทเทิร์นที่อยู่ติดกันซ้อนทับกัน ทำให้ต่อกันได้ทั้งคอ', () => {
    for (const key of SCALE_KEYS) {
      const patterns = buildAllPatterns(key)
      for (let i = 1; i < patterns.length; i++) {
        expect(patterns[i].from, `${key.tonic} ${patterns[i].shape}`).toBeLessThanOrEqual(patterns[i - 1].to)
      }
    }
  })

  it('5 รูปรวมกันครอบคลุมทุกเสียงของสเกลในช่วงที่แพทเทิร์นกินพื้นที่', () => {
    // เทียบที่ “เสียง” ไม่ใช่ “ช่อง” เพราะเสียงเดียวกันเล่นได้หลายสาย
    // แพทเทิร์นเลือกเล่นสายเดียวตามกติกาไม่เล่นเสียงซ้ำ (เช่น B สายเปล่า กับ B เฟรต 4 สาย 3)
    for (const key of SCALE_KEYS) {
      const patterns = buildAllPatterns(key)
      const covered = new Set(patterns.flatMap((p) => p.positions.map((n) => n.midi)))
      const lo = Math.min(...patterns.map((p) => p.from))
      const hi = Math.max(...patterns.map((p) => p.to))
      const inRange = allScalePositions(key).filter((n) => n.fret >= lo && n.fret <= hi)
      const lowest = Math.min(...patterns.flatMap((p) => p.positions.map((n) => n.midi)))
      const highest = Math.max(...patterns.flatMap((p) => p.positions.map((n) => n.midi)))
      const missing = inRange.filter((n) => n.midi >= lowest && n.midi <= highest && !covered.has(n.midi))
      expect(missing.map((n) => `${key.tonic}:${n.pc}${n.fret}`)).toEqual([])
    }
  })
})

describe('คีย์อื่นใช้รูปนิ้วเดียวกัน', () => {
  /** รูปนิ้ว: เฟรตของแต่ละสาย นับจากเฟรตแรกของกรอบ */
  const shapeOf = (p: ScalePattern) =>
    [6, 5, 4, 3, 2, 1]
      .map((s) => p.positions.filter((n) => n.string === s).map((n) => n.fret - p.from).join(','))
      .join(' | ')

  it('แต่ละรูปเป็นรูปเดียวกันทุกคีย์ ต่างแค่เลื่อนเฟรต', () => {
    for (const shape of CAGED_ORDER) {
      const shapes = SCALE_KEYS.map((key) => shapeOf(buildPattern(key, shape)))
      expect(new Set(shapes), `รูป ${shape}`).toHaveLength(1)
    }
  })

  it('ทุกรูปมีขั้นครบ 1-7', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        const degrees = new Set(buildPattern(key, shape).positions.map((n) => n.degree))
        expect([...degrees].sort(), `${key.tonic} รูป ${shape}`).toEqual([1, 2, 3, 4, 5, 6, 7])
      }
    }
  })

  it('โน้ตรูทอยู่บนสายประจำรูปคอร์ดนั้น', () => {
    for (const key of SCALE_KEYS) {
      for (const shape of CAGED_ORDER) {
        const p = buildPattern(key, shape)
        const strings = p.positions.filter((n) => n.root).map((n) => n.string)
        expect(strings, `${key.tonic} รูป ${shape}`).toContain(p.rootString)
      }
    }
  })

  it('ทุกคีย์ไมเนอร์คู่หูใช้ตำแหน่งเดียวกัน แต่คนละโน้ตรูท', () => {
    for (const key of SCALE_KEYS) {
      const rel = relativeKey(key)
      for (const shape of CAGED_ORDER) {
        expect(ids(buildPattern(rel, shape)), `${rel.tonic}m รูป ${shape}`).toEqual(ids(buildPattern(key, shape)))
        const roots = new Set(buildPattern(rel, shape).positions.filter((n) => n.root).map((n) => n.pc))
        expect(roots).toEqual(new Set([rel.tonic]))
      }
    }
  })
})

describe('ความสัมพันธ์ major ↔ minor', () => {
  it('C major กับ A minor ใช้แพทเทิร์นชุดเดียวกันเป๊ะ', () => {
    for (const shape of CAGED_ORDER) {
      expect(ids(buildPattern(Am, shape))).toEqual(ids(buildPattern(C, shape)))
    }
  })

  it('ต่างกันแค่โน้ตรูท: C major รูทคือ C ส่วน A minor รูทคือ A', () => {
    const major = buildPattern(C, 'E').positions.filter((n) => n.root)
    const minor = buildPattern(Am, 'E').positions.filter((n) => n.root)
    expect(new Set(major.map((n) => n.pc))).toEqual(new Set(['C']))
    expect(new Set(minor.map((n) => n.pc))).toEqual(new Set(['A']))
  })

  it('ไมเนอร์คู่หูอยู่ต่ำกว่าเมเจอร์ 3 เฟรต และแปลงกลับไปมาได้', () => {
    for (const key of SCALE_KEYS) {
      const rel = relativeKey(key)
      expect(rel.mode).toBe('minor')
      expect((chroma(key.tonic) - chroma(rel.tonic) + 12) % 12).toBe(3)
      expect(chroma(relativeKey(rel).tonic)).toBe(chroma(key.tonic))
    }
  })

  it('ไมเนอร์ยึดตำแหน่งแพทเทิร์นจากเมเจอร์คู่หู', () => {
    expect(anchorTonic(Am)).toBe('C')
    expect(anchorTonic(C)).toBe('C')
  })
})

describe('การสะกดชื่อโน้ตตามคีย์', () => {
  it('คีย์ D ใช้ C♯ และ F♯ (ไม่ใช่ D♭ หรือ G♭)', () => {
    const names = new Set(buildPattern({ tonic: 'D', mode: 'major' }, 'E').positions.map((n) => n.pc))
    expect(names.has('C#')).toBe(true)
    expect(names.has('F#')).toBe(true)
    expect(names.has('Db')).toBe(false)
  })
})

describe('ascendingOrder', () => {
  it('เรียงจากเสียงต่ำไปสูงสำหรับเล่นไล่สเกล', () => {
    const order = ascendingOrder(buildPattern(C, 'E'))
    const midis = order.map((n) => n.midi)
    expect(midis).toEqual([...midis].sort((a, b) => a - b))
    expect(order[0].string).toBe(6)
    expect(order[order.length - 1].string).toBe(1)
  })
})
