import type { ReactNode } from 'react'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
}

/** สวิตช์เปิด/ปิด แตะที่ไหนก็ได้ในแถว (ทั้งข้อความและสวิตช์) เพื่อสลับ */
export function ToggleSwitch({ checked, onChange, children }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`toggle-row${checked ? ' on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <span className="toggle-label">{children}</span>
      <span className="toggle" aria-hidden>
        <span className="toggle-text">{checked ? 'เปิด' : 'ปิด'}</span>
        <span className="toggle-knob" />
      </span>
    </button>
  )
}
