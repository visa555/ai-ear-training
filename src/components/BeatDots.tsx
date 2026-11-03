import type { CSSProperties } from 'react'
import { beatCoverage, COUNT_IN, MEASURE_BEATS, type BeatSegment, type BeatTick } from '../rhythm/logic'
import { RHYTHMS, type RhythmValue } from '../rhythm/values'

interface Props {
  /** จังหวะที่กำลังเล่นอยู่ (null = ไม่ได้เล่น) */
  tick: BeatTick | null
  /** ระบายวงกลมตามความยาวของโน้ตตัวนี้ (null = ไม่เฉลย) */
  fill: RhythmValue | null
}

/** ช่องว่างรอบจุดที่เสียงใหม่เริ่มกลางจังหวะ (สัดส่วนของวง) */
const ONSET_GAP = 0.035

/**
 * สร้างพื้นหลังแบบไล่ช่วงให้วงกลมหนึ่งวง: ส่วนที่มีเสียงเป็นสีประจำโน้ต ส่วนที่เงียบเป็นสีพื้น
 * และเว้นขีดบางๆ ตรงที่เสียงใหม่เริ่ม (เช่น เขบ็ต หรือเขบ็ตหลังตัวดำประจุด)
 */
function segmentsBackground(segments: BeatSegment[]): string {
  const onsets = segments.filter((s) => s.onset).map((s) => s.from)
  const covered = (t: number) =>
    segments.some((s) => t >= s.from && t < s.to) && !onsets.some((o) => Math.abs(t - o) < ONSET_GAP)
  const points = new Set([0, 1, ...segments.flatMap((s) => [s.from, s.to]), ...onsets.flatMap((o) => [o - ONSET_GAP, o + ONSET_GAP])])
  const sorted = [...points].filter((p) => p >= 0 && p <= 1).sort((a, b) => a - b)
  const stops: string[] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    const [a, b] = [sorted[i], sorted[i + 1]]
    if (b <= a) continue
    const color = covered((a + b) / 2) ? 'var(--deg)' : 'var(--surface)'
    stops.push(`${color} ${(a * 100).toFixed(1)}% ${(b * 100).toFixed(1)}%`)
  }
  return `linear-gradient(90deg, ${stops.join(', ')})`
}

/**
 * วงกลม 4 วงแทน 4 จังหวะในห้อง · ช่วงนับนำแสดงตัวเลขนับ 1–4
 * ถ้ากำหนด fill จะระบายวงกลมตามความยาวโน้ตไปพร้อมกับเสียง (หลังเล่นจบระบายค้างไว้)
 * ระบายได้ถึงครึ่งจังหวะ เช่น ตัวดำประจุดที่จบกลางจังหวะที่ 2
 */
export function BeatDots({ tick, fill }: Props) {
  const counting = tick?.phase === 'count'

  return (
    <div className="beat-dots" aria-hidden>
      <div className={`beat-count${counting ? ' on' : ''}`}>
        {Array.from({ length: COUNT_IN }, (_, i) => (
          <span key={i} className={counting && tick?.beat === i ? 'now' : ''}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className="beat-row">
        {Array.from({ length: MEASURE_BEATS }, (_, i) => {
          const current = tick?.phase === 'measure' && tick.beat === i
          const reached = tick === null ? true : tick.phase === 'measure' && i <= tick.beat
          const segments = fill && reached ? beatCoverage(fill, i) : []
          const filled = segments.length > 0
          const style: CSSProperties | undefined = filled ? { background: segmentsBackground(segments) } : undefined
          return (
            <span
              key={i}
              className={`beat${current ? ' current' : ''}${filled ? ` filled ${RHYTHMS[fill!].color}` : ''}`}
              style={style}
            >
              {i + 1}
            </span>
          )
        })}
      </div>
    </div>
  )
}
