const WHITE_W = 40
const WHITE_H = 150
const BLACK_W = 24
const BLACK_H = 94
const BLACK_PCS = new Set([1, 3, 6, 8, 10])

export type KeyTone = 'scale' | 'tonic' | 'correct' | 'wrong'

export interface KeyMark {
  tone: KeyTone
  /** ขั้นของสเกล ใช้ระบายสีประจำโน้ต */
  degree?: number
  label?: string
}

interface Props {
  /** midi ของคีย์ซ้ายสุด (ควรเป็นคีย์ขาว) */
  from: number
  /** midi ของคีย์ขวาสุด (รวม) */
  to: number
  marks?: Record<number, KeyMark>
  active?: number[]
  onPress?: (midi: number) => void
}

const isBlack = (midi: number) => BLACK_PCS.has(midi % 12)

export function PianoKeyboard({ from, to, marks = {}, active = [], onPress }: Props) {
  const whites: { midi: number; x: number }[] = []
  const blacks: { midi: number; x: number }[] = []
  for (let midi = from; midi <= to; midi++) {
    if (isBlack(midi)) blacks.push({ midi, x: whites.length * WHITE_W - BLACK_W / 2 })
    else whites.push({ midi, x: whites.length * WHITE_W })
  }
  const width = whites.length * WHITE_W

  const renderKey = (midi: number, x: number, black: boolean) => {
    const mark = marks[midi]
    const classes = [
      'key',
      black ? 'black' : 'white',
      mark?.tone,
      mark?.degree && `deg-${mark.degree}`,
      active.includes(midi) && 'active',
    ]
    const w = black ? BLACK_W : WHITE_W
    const h = black ? BLACK_H : WHITE_H
    return (
      <g
        key={midi}
        className={classes.filter(Boolean).join(' ')}
        onPointerDown={onPress && (() => onPress(midi))}
        role={onPress ? 'button' : undefined}
        aria-label={mark?.label}
      >
        <rect x={x + 1} y={1} width={w - 2} height={h} rx={black ? 5 : 8} />
        {mark?.label && (
          <text x={x + w / 2} y={h - (black ? 10 : 14)} textAnchor="middle">
            {mark.label}
          </text>
        )}
      </g>
    )
  }

  return (
    <svg
      className={`piano${onPress ? ' interactive' : ''}`}
      viewBox={`0 0 ${width} ${WHITE_H + 3}`}
      preserveAspectRatio="xMidYMin meet"
    >
      {whites.map((k) => renderKey(k.midi, k.x, false))}
      {blacks.map((k) => renderKey(k.midi, k.x, true))}
    </svg>
  )
}
