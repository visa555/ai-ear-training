import { describe, expect, it } from 'vitest'
import { KID_TIPS, randomTipIndex } from './tips'

describe('randomTipIndex', () => {
  it('อยู่ในช่วงของรายการเสมอ', () => {
    for (const r of [0, 0.5, 0.9999]) {
      const i = randomTipIndex(undefined, () => r)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(i).toBeLessThan(KID_TIPS.length)
    }
  })

  it('ไม่ซ้ำกับข้อเดิม และยังสุ่มได้ถึงข้อสุดท้าย', () => {
    for (let exclude = 0; exclude < KID_TIPS.length; exclude++) {
      for (const r of [0, 0.3, 0.9999]) {
        const i = randomTipIndex(exclude, () => r)
        expect(i).not.toBe(exclude)
        expect(i).toBeLessThan(KID_TIPS.length)
      }
    }
    expect(randomTipIndex(0, () => 0.9999)).toBe(KID_TIPS.length - 1)
  })
})
