import { describe, expect, it } from 'vitest'
import {
  beatCoverage,
  buildRhythmSchedule,
  COUNT_IN,
  generateRhythmQuestions,
  MEASURE_BEATS,
  RHYTHM_LEVELS,
} from './logic'
import { RHYTHM_ORDER, RHYTHMS } from './values'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe('RHYTHMS', () => {
  it('ความยาวของเสียงย่อยรวมกันเท่ากับความยาวตัวโน้ต', () => {
    for (const v of RHYTHM_ORDER) {
      const info = RHYTHMS[v]
      expect(info.sounds.reduce((sum, s) => sum + s.beats, 0)).toBe(info.beats)
    }
  })

  it('ทุกตัวโน้ตพอดีใน 1 ห้อง 4/4', () => {
    for (const v of RHYTHM_ORDER) expect(RHYTHMS[v].beats).toBeLessThanOrEqual(MEASURE_BEATS)
  })
})

describe('RHYTHM_LEVELS', () => {
  it('ด่าน 1 เริ่มจากตัวที่ต่างกันชัด และด่านสุดท้ายมีครบทุกตัว', () => {
    expect(RHYTHM_LEVELS[0].values).toEqual(['whole', 'quarter'])
    expect(RHYTHM_LEVELS[RHYTHM_LEVELS.length - 1].values).toEqual(RHYTHM_ORDER)
  })
})

describe('generateRhythmQuestions', () => {
  it('ได้จำนวนข้อตามที่ขอ ไม่ซ้ำติดกัน และอยู่ใน pool', () => {
    const pool = RHYTHM_LEVELS[4].values
    const qs = generateRhythmQuestions(pool, 80, seeded(2))
    expect(qs).toHaveLength(80)
    for (let i = 1; i < qs.length; i++) expect(qs[i]).not.toBe(qs[i - 1])
    for (const q of qs) expect(pool).toContain(q)
  })

  it('pool ว่างคืนค่าว่าง', () => {
    expect(generateRhythmQuestions([], 3)).toEqual([])
  })
})

describe('buildRhythmSchedule', () => {
  it('นับนำ 4 จังหวะตามด้วยห้องโน้ต 4 จังหวะ ที่ 60 BPM จังหวะละ 1 วินาที', () => {
    const s = buildRhythmSchedule({ value: 'quarter', bpm: 60, clicks: true })
    expect(s.beats.map((b) => b.time)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(s.beats.filter((b) => b.phase === 'count')).toHaveLength(COUNT_IN)
    expect(s.beats.filter((b) => b.accent).map((b) => b.time)).toEqual([0, 4])
    expect(s.total).toBe(8)
  })

  it('โน้ตเริ่มหลังนับนำพอดี และความยาวตามชนิดโน้ต (เว้นท้ายเล็กน้อย)', () => {
    const whole = buildRhythmSchedule({ value: 'whole', bpm: 60, clicks: true })
    expect(whole.sounds).toHaveLength(1)
    expect(whole.sounds[0].time).toBe(4)
    expect(whole.sounds[0].duration).toBeCloseTo(3.6)

    const half = buildRhythmSchedule({ value: 'half', bpm: 60, clicks: true })
    expect(half.sounds[0].duration).toBeCloseTo(1.8)
  })

  it('เขบ็ต 1 ชั้นมี 2 เสียง ห่างกันครึ่งจังหวะ', () => {
    const s = buildRhythmSchedule({ value: 'eighths', bpm: 60, clicks: true })
    expect(s.sounds.map((x) => x.time)).toEqual([4, 4.5])
    expect(s.sounds[0].duration).toBeCloseTo(0.45)
  })

  it('ปิดเสียงเคาะระหว่างโน้ตได้ แต่นับนำยังเคาะเสมอ', () => {
    const s = buildRhythmSchedule({ value: 'half', bpm: 80, clicks: false })
    expect(s.beats.filter((b) => b.phase === 'count').every((b) => b.click)).toBe(true)
    expect(s.beats.filter((b) => b.phase === 'measure').some((b) => b.click)).toBe(false)
  })
})

describe('โน้ตประจุด', () => {
  it('จุดเพิ่มความยาวอีกครึ่งหนึ่ง: ตัวขาวประจุด 3 จังหวะ, ตัวดำประจุด 1½ จังหวะ', () => {
    expect(RHYTHMS.dottedHalf.beats).toBe(RHYTHMS.half.beats * 1.5)
    expect(RHYTHMS.dottedQuarter.sounds[0].beats).toBe(RHYTHMS.quarter.beats * 1.5)
  })

  it('ตัวดำประจุด + เขบ็ต: เสียงที่ 2 เริ่มกลางจังหวะที่ 2', () => {
    const s = buildRhythmSchedule({ value: 'dottedQuarter', bpm: 60, clicks: true })
    expect(s.sounds.map((x) => x.time)).toEqual([4, 5.5])
    expect(s.sounds[0].duration).toBeCloseTo(1.35)
  })

  it('ด่าน 4 เน้นแยกความยาว 2 / 3 / 4 จังหวะ', () => {
    expect(RHYTHM_LEVELS[3].values).toContain('dottedHalf')
    expect(RHYTHM_LEVELS[3].values).toContain('whole')
    expect(RHYTHM_LEVELS[3].values).toContain('half')
  })
})

describe('beatCoverage', () => {
  it('ตัวขาวประจุดระบายเต็ม 3 วง วงที่ 4 ว่าง', () => {
    expect([0, 1, 2].map((i) => beatCoverage('dottedHalf', i))).toEqual([
      [{ from: 0, to: 1, onset: false }],
      [{ from: 0, to: 1, onset: false }],
      [{ from: 0, to: 1, onset: false }],
    ])
    expect(beatCoverage('dottedHalf', 3)).toEqual([])
  })

  it('ตัวดำประจุด + เขบ็ต: วงที่ 2 แบ่งครึ่ง มีเสียงใหม่เริ่มกลางวง', () => {
    expect(beatCoverage('dottedQuarter', 0)).toEqual([{ from: 0, to: 1, onset: false }])
    expect(beatCoverage('dottedQuarter', 1)).toEqual([
      { from: 0, to: 0.5, onset: false },
      { from: 0.5, to: 1, onset: true },
    ])
    expect(beatCoverage('dottedQuarter', 2)).toEqual([])
  })

  it('เขบ็ต 1 ชั้น: 2 เสียงในวงเดียว', () => {
    expect(beatCoverage('eighths', 0)).toEqual([
      { from: 0, to: 0.5, onset: false },
      { from: 0.5, to: 1, onset: true },
    ])
  })
})
