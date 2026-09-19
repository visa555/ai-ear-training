/** ตัวเลือกเวลาตอบ (วินาที) 0 = ไม่จับเวลา */
export const TIME_LIMITS = [
  { value: 0, icon: '♾️', label: 'ไม่จับเวลา' },
  { value: 20, icon: '🐢', label: '20 วิ' },
  { value: 10, icon: '🐇', label: '10 วิ' },
  { value: 5, icon: '🚀', label: '5 วิ' },
] as const

/** ความถี่ในการอัปเดตตัวจับเวลา (มิลลิวินาที) */
export const TICK_MS = 100

/** เวลาที่เหลือหลังผ่านไป elapsed มิลลิวินาที (ไม่ต่ำกว่า 0) */
export function tick(remainingMs: number, elapsedMs: number): number {
  return Math.max(0, remainingMs - elapsedMs)
}

/** วินาทีที่แสดงบนจอ: ปัดขึ้น เพื่อให้เห็น "1" จนกว่าจะหมดเวลาจริง */
export function displaySeconds(remainingMs: number): number {
  return Math.ceil(remainingMs / 1000)
}

/** ใกล้หมดเวลา: เหลือไม่เกิน 30% หรือไม่เกิน 3 วินาที */
export function isUrgent(remainingMs: number, totalMs: number): boolean {
  return remainingMs <= Math.max(totalMs * 0.3, 3000)
}
