import { useState, type CSSProperties } from 'react'

const PIECES = 22

/** กระดาษสีพุ่งกระจายเมื่อตอบถูก (ปิดอัตโนมัติถ้าผู้ใช้ตั้งค่าลดการเคลื่อนไหว) */
export function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: PIECES }, (_, i) => ({
      degree: (i % 7) + 1,
      left: 10 + Math.random() * 80,
      dx: (Math.random() - 0.5) * 160,
      rot: Math.random() * 540 - 270,
      delay: Math.random() * 0.15,
      round: i % 3 === 0,
    })),
  )
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`deg-${p.degree}${p.round ? ' round' : ''}`}
          style={
            {
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              '--dx': `${p.dx}px`,
              '--rot': `${p.rot}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}
