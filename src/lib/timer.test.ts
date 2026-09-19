import { describe, expect, it } from 'vitest'
import { displaySeconds, isUrgent, tick, TIME_LIMITS } from './timer'

describe('timer', () => {
  it('ค่าเริ่มต้นคือไม่จับเวลา', () => {
    expect(TIME_LIMITS[0].value).toBe(0)
  })

  it('นับถอยหลังแล้วหยุดที่ 0', () => {
    expect(tick(5000, 100)).toBe(4900)
    expect(tick(50, 100)).toBe(0)
  })

  it('แสดงวินาทีแบบปัดขึ้น', () => {
    expect(displaySeconds(10000)).toBe(10)
    expect(displaySeconds(9001)).toBe(10)
    expect(displaySeconds(100)).toBe(1)
    expect(displaySeconds(0)).toBe(0)
  })

  it('ใกล้หมดเวลาเมื่อเหลือ ≤ 30% หรือ ≤ 3 วินาที', () => {
    expect(isUrgent(7000, 20000)).toBe(false)
    expect(isUrgent(6000, 20000)).toBe(true)
    expect(isUrgent(3500, 5000)).toBe(false)
    expect(isUrgent(3000, 5000)).toBe(true)
  })
})
