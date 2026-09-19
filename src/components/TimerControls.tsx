import { displaySeconds, isUrgent, TIME_LIMITS } from '../lib/timer'

interface SelectProps {
  value: number
  onChange: (seconds: number) => void
  /** คำอธิบายว่าจับเวลาอะไร เช่น "ต่อข้อ" */
  unit: string
}

/** ตัวเลือกเวลาตอบในหน้าตั้งค่าของแต่ละเกม */
export function TimerSelect({ value, onChange, unit }: SelectProps) {
  return (
    <fieldset className="timer-select">
      <legend>⏰ จับเวลาตอบ {unit}</legend>
      <div className="segmented" role="radiogroup" aria-label={`จับเวลาตอบ ${unit}`}>
        {TIME_LIMITS.map((t) => (
          <button
            key={t.value}
            role="radio"
            aria-checked={t.value === value}
            className={t.value === value ? 'selected' : ''}
            onClick={() => onChange(t.value)}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

interface BarProps {
  remainingMs: number
  seconds: number
  /** หยุดชั่วคราว (เช่น ระหว่างเล่นเสียง) */
  paused?: boolean
}

/** แถบเวลาที่เหลือระหว่างเล่น */
export function TimerBar({ remainingMs, seconds, paused = false }: BarProps) {
  const total = seconds * 1000
  const urgent = remainingMs > 0 && isUrgent(remainingMs, total)
  const shown = displaySeconds(remainingMs)
  return (
    <div
      className={`timer${urgent ? ' urgent' : ''}${paused ? ' paused' : ''}`}
      role="timer"
      aria-label={`เหลือเวลา ${shown} วินาที`}
    >
      <span className="timer-num" aria-hidden>
        {paused ? '⏸' : '⏰'} {shown}
      </span>
      <div className="timer-track" aria-hidden>
        <div className="timer-fill" style={{ width: `${(remainingMs / total) * 100}%` }} />
      </div>
    </div>
  )
}
