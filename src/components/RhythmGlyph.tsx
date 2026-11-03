import type { RhythmValue } from '../rhythm/values'

interface Props {
  value: RhythmValue
  className?: string
}

const LINE_Y = 52
const RX = 8.5
const RY = 6.2
const STEM = 38

function Head({ cx, hollow }: { cx: number; hollow: boolean }) {
  return (
    <ellipse
      className={hollow ? 'rg-head hollow' : 'rg-head'}
      cx={cx}
      cy={LINE_Y}
      rx={RX}
      ry={RY}
      transform={`rotate(-20 ${cx} ${LINE_Y})`}
    />
  )
}

const Stem = ({ x }: { x: number }) => <line className="rg-stem" x1={x} x2={x} y1={LINE_Y - 1} y2={LINE_Y - STEM} />

/** จุดประ: อยู่ขวาหัวโน้ต สูงขึ้นเล็กน้อย (ในช่องเหนือเส้น) */
const Dot = ({ cx }: { cx: number }) => <circle className="rg-dot" cx={cx + RX + 6} cy={LINE_Y - 4} r={3} />

/** หางธงของเขบ็ตตัวเดี่ยว */
function Flag({ x }: { x: number }) {
  const top = LINE_Y - STEM
  return (
    <path
      className="rg-flag"
      d={`M${x} ${top} C ${x + 1} ${top + 7} ${x + 11} ${top + 9} ${x + 8} ${top + 20} C ${x + 7} ${top + 13} ${x + 2} ${top + 12} ${x} ${top + 10} Z`}
    />
  )
}

/** รูปตัวโน้ตตามความยาว วาดบนเส้นเดียวแบบโน้ตจังหวะ (ขนาดปรับตาม CSS) */
export function RhythmGlyph({ value, className }: Props) {
  return (
    <svg className={`rhythm-glyph${className ? ` ${className}` : ''}`} viewBox="0 0 64 64" aria-hidden focusable="false">
      <line className="rg-line" x1={2} x2={62} y1={LINE_Y} y2={LINE_Y} />
      {value === 'whole' && <Head cx={32} hollow />}
      {value === 'dottedHalf' && (
        <>
          <Head cx={26} hollow />
          <Stem x={26 + RX - 1} />
          <Dot cx={26} />
        </>
      )}
      {value === 'dottedQuarter' && (
        <>
          <Head cx={14} hollow={false} />
          <Stem x={14 + RX - 1} />
          <Dot cx={14} />
          <Head cx={46} hollow={false} />
          <Stem x={46 + RX - 1} />
          <Flag x={46 + RX - 1} />
        </>
      )}
      {value === 'half' && (
        <>
          <Head cx={30} hollow />
          <Stem x={30 + RX - 1} />
        </>
      )}
      {value === 'quarter' && (
        <>
          <Head cx={30} hollow={false} />
          <Stem x={30 + RX - 1} />
        </>
      )}
      {value === 'eighths' && (
        <>
          <Head cx={18} hollow={false} />
          <Head cx={42} hollow={false} />
          <Stem x={18 + RX - 1} />
          <Stem x={42 + RX - 1} />
          <rect className="rg-beam" x={18 + RX - 2} y={LINE_Y - STEM - 1} width={42 - 18 + 2} height={5.5} />
        </>
      )}
    </svg>
  )
}
