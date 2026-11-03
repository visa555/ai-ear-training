import { Note } from '@tonaljs/tonal'
import { noteAt, STRINGS } from '../guitar/fretboard'
import { scaleNotes, type KeyDef } from '../theory/keys'

/** คอกีตาร์ในบทเรียนสเกลยาวถึงเฟรต 15 เพราะแพทเทิร์นสุดท้ายเลยเฟรต 12 */
export const SCALE_MAX_FRET = 15

/** รูปคอร์ดที่ใช้ตั้งชื่อแพทเทิร์น (ระบบ CAGED) */
export type CagedShape = 'C' | 'A' | 'G' | 'E' | 'D'

/**
 * เฟรตเริ่มต้นของกรอบแต่ละรูป นับจากเฟรตของโน้ตรูทบนสาย 6
 * (ค่าจากชาร์ต CAGED มาตรฐาน เช่น คีย์ C โน้ตรูทอยู่เฟรต 8 → รูป E เริ่มเฟรต 7)
 * กรอบทั้งห้าขยับขึ้นทีละ 2-3-2-3-2 เฟรต ครบรอบ 12 เฟรตพอดี
 */
const SHAPE_OFFSET: Record<CagedShape, number> = { E: -1, D: 1, C: 4, A: 6, G: 8 }

/** สายที่รูปคอร์ดนั้นวางรากไว้ (ใช้บอกผู้เรียน) */
const SHAPE_ROOT_STRING: Record<CagedShape, number> = { C: 5, A: 5, G: 6, E: 6, D: 4 }

/** ความกว้างของกรอบ: มือครอบ 5 เฟรต */
const BOX_WIDTH = 5

/** โน้ตสูงสุดต่อสายในหนึ่งแพทเทิร์น */
const MAX_PER_STRING = 3

export const CAGED_ORDER: CagedShape[] = ['C', 'A', 'G', 'E', 'D']

/** คีย์ยอดนิยมบนกีตาร์ และคีย์ไมเนอร์คู่หูของมัน */
export const SCALE_KEYS: KeyDef[] = [
  { tonic: 'G', mode: 'major' },
  { tonic: 'C', mode: 'major' },
  { tonic: 'D', mode: 'major' },
  { tonic: 'A', mode: 'major' },
  { tonic: 'E', mode: 'major' },
]

export interface ScalePosition {
  string: number
  fret: number
  midi: number
  /** ชื่อโน้ตตามการสะกดของคีย์นั้น เช่น คีย์ D ใช้ C♯ ไม่ใช่ D♭ */
  pc: string
  /** 0 = C … 6 = B ใช้เลือกสีประจำโน้ต */
  letterIndex: number
  /** ขั้นที่เท่าไรของสเกล (1–7) */
  degree: number
  /** เป็นโน้ตรูท (ราก) ของคีย์ที่เลือกไหม */
  root: boolean
}

export interface ScalePattern {
  shape: CagedShape
  /** สายที่รูปคอร์ดนี้วางรากไว้ */
  rootString: number
  /** ช่วงเฟรตของแพทเทิร์น */
  from: number
  to: number
  positions: ScalePosition[]
}

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
const chromaOf = (pc: string) => Note.chroma(pc)!

/** โน้ตในสเกลของคีย์ แม็พด้วย chroma เพื่อเทียบกับโน้ตบนคอได้ไม่ว่าจะสะกดแบบไหน */
function scaleByChroma(key: KeyDef) {
  const map = new Map<number, { pc: string; degree: number; letterIndex: number }>()
  scaleNotes(key).forEach((n, i) => {
    map.set(chromaOf(n.pc), {
      pc: n.pc,
      degree: i + 1,
      letterIndex: LETTERS.indexOf(n.pc[0]),
    })
  })
  return map
}

/**
 * คีย์ที่ใช้ยึดตำแหน่งแพทเทิร์น: ไมเนอร์ใช้เมเจอร์คู่หู (ขั้นที่ 3 ของไมเนอร์)
 * เพราะใช้โน้ตชุดเดียวกัน แพทเทิร์นจึงอยู่ที่เดิมเป๊ะ ต่างกันแค่โน้ตรูท
 */
export function anchorTonic(key: KeyDef): string {
  const notes = scaleNotes(key)
  return key.mode === 'major' ? notes[0].pc : notes[2].pc
}

/** คีย์เมเจอร์คู่หูของคีย์ไมเนอร์ (และกลับกัน) */
export function relativeKey(key: KeyDef): KeyDef {
  const notes = scaleNotes(key)
  return key.mode === 'major'
    ? { tonic: notes[5].pc, mode: 'minor' }
    : { tonic: notes[2].pc, mode: 'major' }
}

/** เฟรตต่ำสุด (0–11) ของโน้ตตัวหนึ่งบนสายที่กำหนด */
function lowestFret(stringNumber: number, pc: string): number {
  const target = chromaOf(pc)
  for (let fret = 0; fret < 12; fret++) {
    if (chromaOf(noteAt(stringNumber, fret).pc) === target) return fret
  }
  throw new Error(`ไม่พบโน้ต ${pc} บนสาย ${stringNumber}`)
}

/**
 * สร้างแพทเทิร์นหนึ่งรูป
 *
 * กติกาเดียวกับชาร์ต CAGED มาตรฐาน:
 * 1. กรอบกว้าง 5 เฟรต ตามตำแหน่งมือของรูปนั้น
 * 2. เอาโน้ตในสเกลทุกตัวที่อยู่ในกรอบ (สายละไม่เกิน 3 โน้ต)
 * 3. เสียงเดียวกันที่เล่นได้สองสาย (คู่สาย 3 กับสาย 2)
 *    เลือกตัวที่เฟรตต่ำกว่า คือสายที่สูงกว่า ตามที่ชาร์ตมาตรฐานวางไว้
 *
 * ได้ 16-17 โน้ตต่อรูป แล้วแต่ว่ากรอบนั้นมีโน้ตในสเกลกี่ตัว
 */
export function buildPattern(key: KeyDef, shape: CagedShape): ScalePattern {
  const scale = scaleByChroma(key)
  const rootChroma = chromaOf(scaleNotes(key)[0].pc)
  const tonicFret = lowestFret(6, anchorTonic(key))
  let lo = (((tonicFret + SHAPE_OFFSET[shape]) % 12) + 12) % 12
  // แพทเทิร์น CAGED เป็นรูปเลื่อนได้ ใช้นิ้วกดทุกตัว ไม่ใช้สายเปล่า
  // กล่องที่ตกที่เฟรต 0 จึงเลื่อนขึ้นไปอีก 1 ออคเทฟ (เหมือนชาร์ตมาตรฐาน)
  if (lo === 0) lo = 12
  const hi = Math.min(lo + BOX_WIDTH - 1, SCALE_MAX_FRET)

  // ไล่จากสายสูงลงมา เสียงที่ซ้ำกันจึงเหลืออยู่บนสายที่เฟรตต่ำกว่า
  const taken = new Map<number, ScalePosition[]>()
  const used = new Set<number>()
  for (const stringNumber of [1, 2, 3, 4, 5, 6]) {
    const onString: ScalePosition[] = []
    for (let fret = lo; fret <= hi && onString.length < MAX_PER_STRING; fret++) {
      const note = noteAt(stringNumber, fret)
      const info = scale.get(chromaOf(note.pc))
      if (!info || used.has(note.midi)) continue
      used.add(note.midi)
      onString.push({
        string: stringNumber,
        fret,
        midi: note.midi,
        pc: info.pc,
        letterIndex: info.letterIndex,
        degree: info.degree,
        root: chromaOf(note.pc) === rootChroma,
      })
    }
    taken.set(stringNumber, onString)
  }
  const positions = [6, 5, 4, 3, 2, 1].flatMap((s) => taken.get(s) ?? [])

  // กรอบที่แสดงจริงหดลงมาเท่าเฟรตที่มีโน้ต (รูป E จึงเหลือ 4 เฟรต)
  const frets = positions.map((n) => n.fret)
  return {
    shape,
    rootString: SHAPE_ROOT_STRING[shape],
    from: Math.min(...frets),
    to: Math.max(...frets),
    positions,
  }
}

/** ทั้ง 5 แพทเทิร์นของคีย์ เรียงจากเฟรตต่ำไปสูง */
export function buildAllPatterns(key: KeyDef): ScalePattern[] {
  return CAGED_ORDER.map((shape) => buildPattern(key, shape)).sort((a, b) => a.from - b.from)
}

/** โน้ตในสเกลทุกตำแหน่งบนคอ (ใช้ตอนดูภาพรวม “ทั้งคอ”) */
export function allScalePositions(key: KeyDef, maxFret = SCALE_MAX_FRET): ScalePosition[] {
  const scale = scaleByChroma(key)
  const rootChroma = chromaOf(scaleNotes(key)[0].pc)
  const positions: ScalePosition[] = []
  for (const s of STRINGS) {
    for (let fret = 0; fret <= maxFret; fret++) {
      const note = noteAt(s.number, fret)
      const inScale = scale.get(chromaOf(note.pc))
      if (!inScale) continue
      positions.push({
        string: s.number,
        fret,
        midi: note.midi,
        pc: inScale.pc,
        letterIndex: inScale.letterIndex,
        degree: inScale.degree,
        root: chromaOf(note.pc) === rootChroma,
      })
    }
  }
  return positions
}

/** ไล่สเกลในแพทเทิร์นจากเสียงต่ำไปสูง (ใช้เล่นเสียง) */
export function ascendingOrder(pattern: ScalePattern): ScalePosition[] {
  return [...pattern.positions].sort((a, b) => a.midi - b.midi || a.string - b.string)
}
