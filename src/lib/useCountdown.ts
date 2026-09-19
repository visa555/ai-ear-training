import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { tick, TICK_MS } from './timer'

interface Options {
  /** เวลาทั้งหมด (วินาที) 0 = ปิด */
  seconds: number
  /** นับเฉพาะตอนที่เป็น true (หยุดชั่วคราวได้ เช่น ระหว่างเล่นเสียง) */
  running: boolean
  /** เปลี่ยนค่านี้เพื่อเริ่มนับใหม่ เช่น เมื่อขึ้นข้อใหม่ */
  resetKey: unknown
  onExpire: () => void
}

/** ตัวนับถอยหลังที่หยุดชั่วคราวได้ คืนค่าเวลาที่เหลือ (มิลลิวินาที) */
export function useCountdown({ seconds, running, resetKey, onExpire }: Options): number {
  const total = seconds * 1000
  const [remaining, setRemaining] = useState(total)
  const expired = useRef(false)
  const onExpireRef = useRef(onExpire)
  useLayoutEffect(() => {
    onExpireRef.current = onExpire
  })

  // เริ่มนับใหม่เมื่อ resetKey หรือเวลาทั้งหมดเปลี่ยน
  const [lastReset, setLastReset] = useState({ resetKey, total })
  if (lastReset.resetKey !== resetKey || lastReset.total !== total) {
    setLastReset({ resetKey, total })
    setRemaining(total)
  }
  useEffect(() => {
    expired.current = false
  }, [resetKey, total])

  useEffect(() => {
    if (!total || !running) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const elapsed = now - last
      last = now
      setRemaining((r) => tick(r, elapsed))
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [total, running, resetKey])

  useEffect(() => {
    if (total && running && remaining === 0 && !expired.current) {
      expired.current = true
      onExpireRef.current()
    }
  }, [remaining, running, total])

  return remaining
}
