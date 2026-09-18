import type { ReactNode } from 'react'

export type MascotMood = 'idle' | 'listen' | 'happy' | 'oops' | 'cheer'

const BADGE: Record<MascotMood, string> = {
  idle: '🎵',
  listen: '👂',
  happy: '✨',
  oops: '💪',
  cheer: '🎉',
}

interface Props {
  mood?: MascotMood
  children: ReactNode
}

/** น้องฮูก ผู้ช่วยประจำแอป พูดผ่านกล่องข้อความ */
export function Mascot({ mood = 'idle', children }: Props) {
  return (
    <div className={`mascot mood-${mood}`}>
      <div className="mascot-face" aria-hidden>
        🦉<span className="mascot-badge">{BADGE[mood]}</span>
      </div>
      <div className="bubble" role="status" aria-live="polite">
        {children}
      </div>
    </div>
  )
}
