import { describe, expect, it } from 'vitest'
import {
  describePosition,
  fixedSolfege,
  isOnLine,
  ledgerLines,
  naturalRange,
  shortPosition,
  staffNote,
  stemUp,
} from './staff'

describe('staffNote', () => {
  it('ตำแหน่งในกุญแจซอล: E4 เส้นล่างสุด, B4 เส้นกลาง, F5 เส้นบนสุด', () => {
    expect(staffNote('E4').pos).toBe(0)
    expect(staffNote('F4').pos).toBe(1)
    expect(staffNote('G4').pos).toBe(2)
    expect(staffNote('B4').pos).toBe(4)
    expect(staffNote('F5').pos).toBe(8)
  })

  it('ข้ามออคเทฟถูกต้อง (B3 ต่ำกว่า C4 หนึ่งขั้น)', () => {
    expect(staffNote('C4').pos).toBe(-2)
    expect(staffNote('B3').pos).toBe(-3)
    expect(staffNote('C5').pos).toBe(5)
    expect(staffNote('A5').pos).toBe(10)
  })

  it('คืน midi และสีประจำโน้ต', () => {
    const e = staffNote('E4')
    expect(e.midi).toBe(64)
    expect(e.letterIndex).toBe(2)
    expect(fixedSolfege(e)).toBe('Mi')
  })

  it('ไม่รับโน้ตที่มีชาร์ป/แฟลตในเฟสนี้', () => {
    expect(() => staffNote('F#4')).toThrow()
  })
})

describe('naturalRange', () => {
  it('C4 ถึง C5 มี 8 ตัว เรียงจากต่ำไปสูง', () => {
    expect(naturalRange('C4', 'C5').map((n) => n.name)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
  })

  it('ข้ามจาก B ไป C ของออคเทฟถัดไปได้', () => {
    expect(naturalRange('A3', 'D4').map((n) => n.name)).toEqual(['A3', 'B3', 'C4', 'D4'])
  })
})

describe('เส้น ช่อง เส้นน้อย และหางโน้ต', () => {
  it('แยกบนเส้น/ในช่อง', () => {
    expect(isOnLine(staffNote('E4').pos)).toBe(true)
    expect(isOnLine(staffNote('F4').pos)).toBe(false)
    expect(isOnLine(staffNote('C4').pos)).toBe(true)
  })

  it('เส้นน้อย: C4 หนึ่งเส้น, D4 ไม่มี, A3 สองเส้น, A5 หนึ่งเส้นด้านบน', () => {
    expect(ledgerLines(staffNote('C4').pos)).toEqual([-2])
    expect(ledgerLines(staffNote('D4').pos)).toEqual([])
    expect(ledgerLines(staffNote('B3').pos)).toEqual([-2])
    expect(ledgerLines(staffNote('A3').pos)).toEqual([-2, -4])
    expect(ledgerLines(staffNote('G5').pos)).toEqual([])
    expect(ledgerLines(staffNote('A5').pos)).toEqual([10])
  })

  it('หางโน้ตชี้ลงตั้งแต่เส้นกลาง (B4) ขึ้นไป', () => {
    expect(stemUp(staffNote('A4').pos)).toBe(true)
    expect(stemUp(staffNote('B4').pos)).toBe(false)
  })
})

describe('describePosition', () => {
  it('อธิบายตำแหน่งเป็นภาษาไทย', () => {
    expect(describePosition(staffNote('E4').pos)).toBe('อยู่บนเส้นที่ 1')
    expect(describePosition(staffNote('F4').pos)).toBe('อยู่ในช่องที่ 1')
    expect(describePosition(staffNote('F5').pos)).toBe('อยู่บนเส้นที่ 5')
    expect(describePosition(staffNote('E5').pos)).toBe('อยู่ในช่องที่ 4')
    expect(describePosition(staffNote('D4').pos)).toBe('ห้อยอยู่ใต้เส้นที่ 1')
    expect(describePosition(staffNote('C4').pos)).toBe('มีเส้นน้อยขีดทับ (เส้นน้อยที่ 1 ใต้บรรทัด)')
    expect(describePosition(staffNote('B3').pos)).toBe('ห้อยอยู่ใต้เส้นน้อยที่ 1')
    expect(describePosition(staffNote('G5').pos)).toBe('นั่งอยู่บนเส้นที่ 5')
    expect(describePosition(staffNote('A5').pos)).toBe('มีเส้นน้อยขีดทับ (เส้นน้อยที่ 1 เหนือบรรทัด)')
  })
})

describe('shortPosition', () => {
  it('แยกโน้ตชื่อเดียวกันคนละออคเทฟได้', () => {
    const labels = ['A3', 'A4', 'A5'].map((n) => shortPosition(staffNote(n).pos))
    expect(labels).toEqual(['เส้นน้อยล่าง 2', 'ช่อง 2', 'เส้นน้อยบน 1'])
    expect(new Set(naturalRange('A3', 'A5').map((n) => shortPosition(n.pos))).size).toBe(15)
  })

  it('ตำแหน่งขอบบรรทัด', () => {
    expect(shortPosition(staffNote('D4').pos)).toBe('ใต้เส้น 1')
    expect(shortPosition(staffNote('G5').pos)).toBe('บนเส้น 5')
    expect(shortPosition(staffNote('B3').pos)).toBe('ใต้เส้นน้อยล่าง 1')
  })
})
