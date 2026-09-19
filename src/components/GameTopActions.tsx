import { useEffect, useState } from 'react'

/** เวลาที่ปุ่มรอการแตะครั้งที่สอง (มิลลิวินาที) */
const CONFIRM_MS = 3000

interface Props {
  onRestart: () => void
  onQuit: () => void
}

/**
 * ปุ่มเริ่มใหม่และออกจากเกม · ปุ่มเริ่มใหม่ต้องแตะสองครั้ง
 * เพื่อไม่ให้เด็กเผลอแตะแล้วความคืบหน้าหายไป
 */
export function GameTopActions({ onRestart, onQuit }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const id = window.setTimeout(() => setArmed(false), CONFIRM_MS)
    return () => window.clearTimeout(id)
  }, [armed])

  return (
    <div className="top-actions">
      <button
        className={`ghost small restart${armed ? ' armed' : ''}`}
        onClick={() => (armed ? onRestart() : setArmed(true))}
      >
        🔄 {armed ? 'แตะอีกครั้งเพื่อเริ่มใหม่' : 'เริ่มใหม่'}
      </button>
      <button className="ghost small" onClick={onQuit}>
        ✕ ออก
      </button>
    </div>
  )
}
