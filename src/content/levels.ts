import { DEGREES } from '../theory/keys'

/** ด่านที่ใช้ร่วมกันทุกเกม */
export const LEVELS: { icon: string; name: string; degrees: number[] }[] = [
  { icon: '🐣', name: 'ระดับ 1', degrees: [1, 3, 5] },
  { icon: '🐥', name: 'ระดับ 2', degrees: [1, 2, 3, 4, 5] },
  { icon: '🦅', name: 'ระดับ 3', degrees: [...DEGREES] },
]
