import { INLAY_FRETS, noteAt, positionId, STRINGS } from '../guitar/fretboard'

const NUT_W = 30
const FRET_W = 62
const STRING_GAP = 26
const TOP = 26
const LABEL_H = 22

export type MarkState = 'ask' | 'correct' | 'wrong' | 'hint'

export interface FretMark {
  state?: MarkState
  label?: string
  /** โน้ตราก: วาดวงใหญ่กว่าปกติ */
  root?: boolean
  /** class สีประจำโน้ต */
  className?: string
  /** คำอธิบายเมื่อชี้ (tooltip) */
  title?: string
}

interface Props {
  /** จำนวนเฟรตที่แสดง (ไม่นับสายเปล่า) */
  frets: number
  /** สายที่เล่นได้ในตอนนี้ (สายอื่นจะจางลง) */
  activeStrings?: number[]
  /** จุดที่ทำเครื่องหมายไว้ คีย์เป็น "สาย-เฟรต" */
  marks?: Record<string, FretMark>
  onPress?: (stringNumber: number, fret: number) => void
  ariaLabel?: string
}

/** คอกีตาร์แนวนอน สาย 1 (E สูง) อยู่บน สาย 6 (E ต่ำ) อยู่ล่าง เหมือนตอนก้มมองกีตาร์ของตัวเอง */
export function Fretboard({ frets, activeStrings, marks = {}, onPress, ariaLabel }: Props) {
  const width = NUT_W + frets * FRET_W + 10
  const boardBottom = TOP + (STRINGS.length - 1) * STRING_GAP
  const height = boardBottom + LABEL_H + 16
  const fretX = (fret: number) => NUT_W + fret * FRET_W
  /** กึ่งกลางช่องเฟรต (เฟรต 0 = สายเปล่า วางไว้ซ้ายนัต) */
  const cellX = (fret: number) => (fret === 0 ? NUT_W / 2 : fretX(fret) - FRET_W / 2)
  const stringY = (stringNumber: number) => TOP + (stringNumber - 1) * STRING_GAP

  return (
    <svg
      className={`fretboard${onPress ? ' interactive' : ''}`}
      viewBox={`0 0 ${width} ${height}`}
      // ความกว้างขั้นต่ำตามจำนวนเฟรต: ด่านสั้นพอดีจอมือถือ ด่านยาวค่อยเลื่อนดู
      style={{ minWidth: `${NUT_W + frets * 42 + 14}px` }}
      role="img"
      aria-label={ariaLabel ?? 'คอกีตาร์'}
    >
      <rect className="fb-board" x={NUT_W} y={TOP - 10} width={frets * FRET_W} height={boardBottom - TOP + 20} rx={4} />

      {/* จุดบนคอ */}
      {Array.from({ length: frets }, (_, i) => i + 1).map((fret) => {
        const mid = (TOP + boardBottom) / 2
        // จุดคู่ที่เฟรต 12 และ 24 · จุดเดี่ยวที่ 3 5 7 9 ของทุกออคเทฟ (15 17 19 21)
        const within = fret % 12
        if (within === 0) {
          return (
            <g key={`inlay-${fret}`}>
              <circle className="fb-inlay" cx={cellX(fret)} cy={mid - STRING_GAP} r={5} />
              <circle className="fb-inlay" cx={cellX(fret)} cy={mid + STRING_GAP} r={5} />
            </g>
          )
        }
        return INLAY_FRETS.includes(within) ? (
          <circle key={`inlay-${fret}`} className="fb-inlay" cx={cellX(fret)} cy={mid} r={5} />
        ) : null
      })}

      {/* นัตและเส้นเฟรต */}
      <rect className="fb-nut" x={NUT_W - 5} y={TOP - 10} width={5} height={boardBottom - TOP + 20} rx={2} />
      {Array.from({ length: frets }, (_, i) => i + 1).map((fret) => (
        <line key={`fret-${fret}`} className="fb-fret" x1={fretX(fret)} x2={fretX(fret)} y1={TOP - 10} y2={boardBottom + 10} />
      ))}

      {/* สาย: สายเลขมากเส้นหนากว่า */}
      {STRINGS.map((s) => {
        const dim = activeStrings && !activeStrings.includes(s.number)
        return (
          <g key={`string-${s.number}`} className={`fb-string${dim ? ' dim' : ''}`}>
            <line x1={0} x2={width} y1={stringY(s.number)} y2={stringY(s.number)} strokeWidth={0.9 + s.number * 0.38} />
            <text className="fb-string-label" x={width - 2} y={stringY(s.number) + 4} textAnchor="end">
              {s.number}
            </text>
          </g>
        )
      })}

      {/* ช่องกดแต่ละสาย/เฟรต */}
      {STRINGS.map((s) =>
        Array.from({ length: frets + 1 }, (_, fret) => {
          const id = positionId({ string: s.number, fret })
          const mark = marks[id]
          const dim = activeStrings && !activeStrings.includes(s.number)
          const classes = ['fb-cell', mark?.state, mark?.className, dim && 'dim']
          const cx = cellX(fret)
          const cy = stringY(s.number)
          return (
            <g
              key={id}
              className={classes.filter(Boolean).join(' ')}
              onPointerDown={onPress && !dim ? () => onPress(s.number, fret) : undefined}
              role={onPress && !dim ? 'button' : undefined}
              aria-label={onPress ? `สาย ${s.number} เฟรต ${fret} (${noteAt(s.number, fret).name})` : undefined}
            >
              {mark?.title && <title>{mark.title}</title>}
              <rect className="hit" x={cx - FRET_W / 2 + 2} y={cy - STRING_GAP / 2} width={FRET_W - 4} height={STRING_GAP} />
              {mark && (
                <>
                  <circle className="fb-dot" cx={cx} cy={cy} r={mark.root ? 13 : 10} />
                  {mark.label && (
                    <text className="fb-dot-label" x={cx} y={cy + 4} textAnchor="middle">
                      {mark.label}
                    </text>
                  )}
                </>
              )}
            </g>
          )
        }),
      )}

      {/* เลขเฟรตใต้คอ */}
      {Array.from({ length: frets + 1 }, (_, fret) => (
        <text key={`num-${fret}`} className="fb-fret-num" x={cellX(fret)} y={boardBottom + 28} textAnchor="middle">
          {fret}
        </text>
      ))}
    </svg>
  )
}
