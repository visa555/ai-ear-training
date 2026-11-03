export type RhythmValue = 'whole' | 'dottedHalf' | 'half' | 'dottedQuarter' | 'quarter' | 'eighths'

export interface RhythmInfo {
  value: RhythmValue
  name: string
  /** ความยาวรวม (จังหวะ) */
  beats: number
  /** ข้อความบอกความยาวแบบเด็กอ่านง่าย */
  beatsLabel: string
  /** คำช่วยจำแบบ Kodály */
  syllable: string
  animal: string
  /** มีจุดประ (จุดเพิ่มความยาวอีกครึ่งหนึ่งของตัวเอง) */
  dotted?: boolean
  /** class สีประจำตัวโน้ต (ใช้คู่กับชื่อเสมอ) */
  color: string
  /** เสียงย่อยภายในตัวโน้ต: เริ่มที่จังหวะไหน ยาวเท่าไร (หน่วยจังหวะ) */
  sounds: { beat: number; beats: number }[]
}

export const RHYTHMS: Record<RhythmValue, RhythmInfo> = {
  whole: {
    value: 'whole',
    name: 'ตัวกลม',
    beats: 4,
    beatsLabel: '4 จังหวะ',
    syllable: 'ทา–อา–อา–อา',
    animal: '🐘',
    color: 'deg-6',
    sounds: [{ beat: 0, beats: 4 }],
  },
  dottedHalf: {
    value: 'dottedHalf',
    name: 'ตัวขาวประจุด',
    beats: 3,
    beatsLabel: '3 จังหวะ',
    syllable: 'ทา–อา–อา',
    animal: '🦒',
    dotted: true,
    color: 'deg-7',
    sounds: [{ beat: 0, beats: 3 }],
  },
  half: {
    value: 'half',
    name: 'ตัวขาว',
    beats: 2,
    beatsLabel: '2 จังหวะ',
    syllable: 'ทา–อา',
    animal: '🐢',
    color: 'deg-5',
    sounds: [{ beat: 0, beats: 2 }],
  },
  dottedQuarter: {
    value: 'dottedQuarter',
    name: 'ตัวดำประจุด + เขบ็ต',
    beats: 2,
    beatsLabel: '1½ + ½ จังหวะ',
    syllable: 'ทา–อิ ทิ',
    animal: '🐇',
    dotted: true,
    color: 'deg-3',
    sounds: [
      { beat: 0, beats: 1.5 },
      { beat: 1.5, beats: 0.5 },
    ],
  },
  quarter: {
    value: 'quarter',
    name: 'ตัวดำ',
    beats: 1,
    beatsLabel: '1 จังหวะ',
    syllable: 'ทา',
    animal: '🚶',
    color: 'deg-4',
    sounds: [{ beat: 0, beats: 1 }],
  },
  eighths: {
    value: 'eighths',
    name: 'เขบ็ต 1 ชั้น',
    beats: 1,
    beatsLabel: '½ + ½ จังหวะ',
    syllable: 'ทิ-ทิ',
    animal: '🏃',
    color: 'deg-2',
    sounds: [
      { beat: 0, beats: 0.5 },
      { beat: 0.5, beats: 0.5 },
    ],
  },
}

/** เรียงจากยาวไปสั้น */
export const RHYTHM_ORDER: RhythmValue[] = ['whole', 'dottedHalf', 'half', 'dottedQuarter', 'quarter', 'eighths']
