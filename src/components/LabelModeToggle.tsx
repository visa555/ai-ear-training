import type { LabelMode } from '../theory/keys'

const OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'solfege', label: 'โด เร มี' },
  { value: 'degree', label: 'ตัวเลข 1–7' },
  { value: 'note', label: 'ตัวอักษร C D E' },
]

interface Props {
  value: LabelMode
  onChange: (mode: LabelMode) => void
}

export function LabelModeToggle({ value, onChange }: Props) {
  return (
    <div className="segmented" role="radiogroup" aria-label="รูปแบบการแสดงชื่อ">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? 'selected' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
