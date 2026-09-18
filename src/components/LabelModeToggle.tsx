import type { LabelMode } from '../theory/keys'

const OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'degree', label: 'ขั้น (1–7)' },
  { value: 'solfege', label: 'Do Re Mi' },
  { value: 'note', label: 'ชื่อโน๊ต' },
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
