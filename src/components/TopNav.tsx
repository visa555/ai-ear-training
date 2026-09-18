import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

export interface NavItem<T extends string> {
  value: T
  icon: string
  label: string
}

interface Props<T extends string> {
  items: NavItem<T>[]
  current: T
  onSelect: (value: T) => void
  status: string
  statusClass: string
}

/** ระยะห่างระหว่างชื่อแอปกับเมนู (ตรงกับ gap ใน .app-header) */
const HEADER_GAP = 12

/**
 * ตรวจว่าเมนูแบบแถวเดียววางข้างชื่อแอปได้พอดีไหม โดยวัดความกว้างจริงของเมนูสำเนาที่ซ่อนไว้
 * (วัดจริงแทนการตั้ง breakpoint ตายตัว เพราะความกว้างฟอนต์ไทยและข้อความเมนูไม่แน่นอน)
 */
function useCompact(
  header: RefObject<HTMLElement | null>,
  brand: RefObject<HTMLElement | null>,
  measure: RefObject<HTMLElement | null>,
) {
  const [compact, setCompact] = useState(false)
  useLayoutEffect(() => {
    const check = () => {
      if (!header.current || !brand.current || !measure.current) return
      const available = header.current.clientWidth - brand.current.scrollWidth - HEADER_GAP
      setCompact(measure.current.scrollWidth > available)
    }
    check()
    const observer = new ResizeObserver(check)
    if (header.current) observer.observe(header.current)
    // ฟอนต์ Mali โหลดเสร็จทีหลังจะทำให้ข้อความกว้างขึ้น
    void document.fonts?.ready.then(check)
    return () => observer.disconnect()
  }, [header, brand, measure])
  return compact
}

export function TopNav<T extends string>({ items, current, onSelect, status, statusClass }: Props<T>) {
  const headerRef = useRef<HTMLElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLElement>(null)
  const compact = useCompact(headerRef, brandRef, measureRef)
  const [open, setOpen] = useState(false)
  const currentItem = items.find((i) => i.value === current)
  const menuOpen = compact && open

  // เปิดเมนูแล้วย้ายโฟกัสไปที่หน้าปัจจุบัน / ปิดด้วย Esc หรือแตะข้างนอก
  useEffect(() => {
    if (!menuOpen) return
    panelRef.current?.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node
      if (!panelRef.current?.contains(target) && !toggleRef.current?.contains(target)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [menuOpen])

  const select = (value: T) => {
    setOpen(false)
    onSelect(value)
  }

  const renderItems = (focusable: boolean) =>
    items.map((t) => (
      <button
        key={t.value}
        className={t.value === current ? 'selected' : ''}
        aria-current={focusable && t.value === current ? 'page' : undefined}
        tabIndex={focusable ? undefined : -1}
        onClick={focusable ? () => select(t.value) : undefined}
      >
        <span className="tab-icon" aria-hidden>
          {t.icon}
        </span>
        {t.label}
      </button>
    ))

  return (
    <header className="app-header" ref={headerRef}>
      <div className="brand">
        <div className="brand-core" ref={brandRef}>
          <span className="logo" aria-hidden>
            🦉
          </span>
          <h1>
            หูทองน้อย <span className="notes" aria-hidden>♪♫</span>
          </h1>
        </div>
        <p className={`status ${statusClass}`}>{status}</p>
      </div>

      {/* สำเนาเมนูที่มองไม่เห็น ใช้วัดความกว้างอย่างเดียว (อยู่ในกล่องที่ตัดขอบ จึงไม่ดันหน้าให้กว้างเกินจอ) */}
      <div className="measure-clip" aria-hidden inert>
        <div className="tabs tabs-measure" ref={measureRef}>
          {renderItems(false)}
        </div>
      </div>

      {compact ? (
        <div className="menu-wrap">
          <button
            ref={toggleRef}
            className={`menu-toggle${menuOpen ? ' open' : ''}`}
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="hamburger" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="menu-current">
              <span aria-hidden>{currentItem?.icon}</span> {currentItem?.label}
            </span>
          </button>
          {menuOpen && (
            <nav id="main-menu" className="menu-panel" ref={panelRef} aria-label="เมนูหลัก">
              {renderItems(true)}
            </nav>
          )}
        </div>
      ) : (
        <nav className="tabs" aria-label="เมนูหลัก">
          {renderItems(true)}
        </nav>
      )}
    </header>
  )
}
