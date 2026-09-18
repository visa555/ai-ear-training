interface Props {
  className?: string
}

/** โลโก้หน้านกฮูก (สีคงที่ ใช้ได้ทั้งโหมดสว่างและโหมดมืด) ต้องตรงกับ public/favicon.svg */
export function OwlLogo({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden focusable="false">
      {/* หัวและขนหู */}
      <path
        d="M11 22 L7 5 L23 14 Q32 10.5 41 14 L57 5 L53 22 Q60 32 57.5 42 Q53 59 32 60 Q11 59 6.5 42 Q4 32 11 22 Z"
        fill="#7b5cff"
        stroke="#4a33b8"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* ขนตรงหน้าผาก */}
      <path d="M26 17 Q32 21 38 17" fill="none" stroke="#a894ff" strokeWidth="2" strokeLinecap="round" />
      {/* จานหน้า */}
      <circle cx="21.5" cy="33" r="13" fill="#f1ecff" />
      <circle cx="42.5" cy="33" r="13" fill="#f1ecff" />
      {/* แก้ม */}
      <ellipse cx="13" cy="46" rx="3.6" ry="2.3" fill="#ff9bb3" />
      <ellipse cx="51" cy="46" rx="3.6" ry="2.3" fill="#ff9bb3" />
      {/* ตา */}
      <circle cx="21.5" cy="33" r="9" fill="#fff" stroke="#2b2350" strokeWidth="1.6" />
      <circle cx="42.5" cy="33" r="9" fill="#fff" stroke="#2b2350" strokeWidth="1.6" />
      <circle cx="22.5" cy="34" r="5" fill="#2b2350" />
      <circle cx="41.5" cy="34" r="5" fill="#2b2350" />
      <circle cx="24.4" cy="31.8" r="1.8" fill="#fff" />
      <circle cx="43.4" cy="31.8" r="1.8" fill="#fff" />
      {/* จะงอยปาก */}
      <path
        d="M32 39.5 L27.8 44.2 Q32 49.5 36.2 44.2 Z"
        fill="#ffb347"
        stroke="#d98a1f"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}
