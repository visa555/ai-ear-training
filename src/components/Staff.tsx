import { ledgerLines, staffNote, stemUp } from '../notation/staff'

/** ระยะห่างระหว่างเส้น (หน่วย SVG) */
const SP = 12
const TOP_LINE_Y = 60
const BOTTOM_LINE_Y = TOP_LINE_Y + 4 * SP
const CLEF_W = 58
const NOTE_GAP = 54
const HEAD_RX = SP * 0.66
const HEAD_RY = SP * 0.48
const STEM_LEN = SP * 3.4
const LABEL_Y = BOTTOM_LINE_Y + 4.6 * SP

const yOf = (pos: number) => BOTTOM_LINE_Y - (pos * SP) / 2

export type StaffNoteState = 'active' | 'correct' | 'wrong'

export interface StaffItem {
  name: string
  state?: StaffNoteState
  /** ข้อความใต้บรรทัด เช่น ชื่อโน้ต */
  label?: string
  /** class เพิ่มเติมของโน้ต เช่น ระดับสีในหน้าสถิติ */
  className?: string
  /** คำอธิบายเมื่อชี้ (tooltip) */
  title?: string
}

interface Props {
  notes: StaffItem[]
  /** หัวโน้ตมีสีประจำโน้ต (ล้อช่วย) */
  colored?: boolean
  onNoteClick?: (name: string) => void
  /** ระยะห่างระหว่างโน้ต (คูณ) ใช้ขยายเมื่อมีโน้ตตัวเดียว */
  spread?: number
  ariaLabel?: string
}

export function Staff({ notes, colored = true, onNoteClick, spread = 1, ariaLabel }: Props) {
  const gap = NOTE_GAP * spread
  const width = CLEF_W + notes.length * gap + 14
  const hasLabels = notes.some((n) => n.label)
  const height = hasLabels ? LABEL_Y + 14 : BOTTOM_LINE_Y + 4 * SP

  return (
    <svg
      className={`staff${onNoteClick ? ' interactive' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={ariaLabel ?? 'บรรทัด 5 เส้น'}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} className="staff-line" x1={4} x2={width - 4} y1={TOP_LINE_Y + i * SP} y2={TOP_LINE_Y + i * SP} />
      ))}
      <line className="staff-line" x1={4} x2={4} y1={TOP_LINE_Y} y2={BOTTOM_LINE_Y} />
      <line className="staff-line" x1={width - 4} x2={width - 4} y1={TOP_LINE_Y} y2={BOTTOM_LINE_Y} />

      {/* กุญแจซอล: ขดตรงกลางพันรอบเส้นที่ 2 (G) */}
      <text className="clef" x={10} y={yOf(2)} fontSize={SP * 4}>
        𝄞
      </text>

      {notes.map((item, i) => {
        const note = staffNote(item.name)
        const cx = CLEF_W + i * gap + gap / 2
        const cy = yOf(note.pos)
        const up = stemUp(note.pos)
        const stemX = up ? cx + HEAD_RX - 1 : cx - HEAD_RX + 1
        const classes = ['staff-note', colored && `deg-${note.letterIndex + 1} colored`, item.state, item.className]
        return (
          <g
            key={`${item.name}-${i}`}
            className={classes.filter(Boolean).join(' ')}
            onPointerDown={onNoteClick && (() => onNoteClick(item.name))}
            role={onNoteClick ? 'button' : undefined}
            aria-label={onNoteClick ? item.label ?? item.name : undefined}
          >
            {item.title && <title>{item.title}</title>}
            {/* พื้นที่แตะให้ใหญ่กว่าหัวโน้ต */}
            <rect className="hit" x={cx - gap / 2} y={0} width={gap} height={height} />
            {item.state && <circle className="halo" cx={cx} cy={cy} r={SP * 1.25} />}
            {ledgerLines(note.pos).map((p) => (
              <line key={p} className="ledger" x1={cx - HEAD_RX - 6} x2={cx + HEAD_RX + 6} y1={yOf(p)} y2={yOf(p)} />
            ))}
            <line className="stem" x1={stemX} x2={stemX} y1={cy} y2={up ? cy - STEM_LEN : cy + STEM_LEN} />
            <ellipse className="head" cx={cx} cy={cy} rx={HEAD_RX} ry={HEAD_RY} transform={`rotate(-20 ${cx} ${cy})`} />
            {item.label && (
              <text className="staff-label" x={cx} y={LABEL_Y} textAnchor="middle">
                {item.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}
