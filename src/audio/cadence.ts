import type { Step } from './engine'

/**
 * คอร์ด I–IV–V–I วางเสียงให้เคลื่อนที่น้อยที่สุด พร้อมเบสอีกออคเทฟล่าง
 * ไมเนอร์ใช้ i–iv–V–i (V เป็นเมเจอร์เพื่อให้มี leading tone ดึงกลับโทนิก)
 */
export function cadenceChords(tonic: number, minor = false): number[][] {
  const third = minor ? 3 : 4
  const sixth = minor ? 8 : 9
  const I = [tonic - 12, tonic, tonic + third, tonic + 7]
  const IV = [tonic - 7, tonic, tonic + 5, tonic + sixth]
  const V = [tonic - 5, tonic - 1, tonic + 2, tonic + 7]
  return [I, IV, V, I]
}

export function cadenceSteps(tonic: number, minor = false): Step[] {
  return cadenceChords(tonic, minor).map((midis, i, all) =>
    i === all.length - 1 ? { midis, duration: 1.4, next: 1.6 } : { midis, duration: 0.8 },
  )
}

export function tonicChord(tonic: number, minor = false): number[] {
  return [tonic, tonic + (minor ? 3 : 4), tonic + 7]
}
