import { describe, expect, it } from 'vitest'
import {
  keyInfo,
  keyName,
  MAJOR_TONICS,
  matchTonic,
  MINOR_TONICS,
  noteLabel,
  prettyNote,
  scaleNotes,
  scaleWithTopTonic,
  tonicMidi,
  type KeyDef,
  type Mode,
} from './keys'

const major = (tonic: string): KeyDef => ({ tonic, mode: 'major' })
const minor = (tonic: string, mode: Mode = 'minor'): KeyDef => ({ tonic, mode })
const steps = (key: KeyDef) => {
  const m = scaleWithTopTonic(key).map((n) => n.midi)
  return m.slice(1).map((v, i) => v - m[i])
}

describe('scaleNotes (major)', () => {
  it('C major คือโน้ตขาวล้วน เริ่มที่ C4', () => {
    const notes = scaleNotes(major('C'))
    expect(notes.map((n) => n.name)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])
    expect(notes.map((n) => n.midi)).toEqual([60, 62, 64, 65, 67, 69, 71])
    expect(notes.map((n) => n.solfege)).toEqual(['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Ti'])
  })

  it('สะกดชื่อโน้ตถูกต้องตามคีย์ (F# มี E# ไม่ใช่ F)', () => {
    expect(scaleNotes(major('F#')).map((n) => n.pc)).toEqual(['F#', 'G#', 'A#', 'B', 'C#', 'D#', 'E#'])
    expect(scaleNotes(major('Db')).map((n) => n.pc)).toEqual(['Db', 'Eb', 'F', 'Gb', 'Ab', 'Bb', 'C'])
  })

  it('ข้ามออคเทฟได้ถูกต้อง (B major ขึ้นไปถึง A#4)', () => {
    const notes = scaleNotes(major('B'))
    expect(notes[0].name).toBe('B3')
    expect(notes[1].name).toBe('C#4')
    expect(notes[6].midi).toBe(70)
  })

  it('เลื่อนออคเทฟได้', () => {
    expect(scaleNotes(major('C'), -1)[0].midi).toBe(48)
    expect(scaleNotes(major('C'), 1)[0].octaveShift).toBe(1)
  })

  it('ทุกคีย์มีขั้นห่างแบบเมเจอร์ W W H W W W H', () => {
    for (const tonic of MAJOR_TONICS) expect(steps(major(tonic))).toEqual([2, 2, 1, 2, 2, 2, 1])
  })

  it('โทนิกของทุกคีย์อยู่ช่วง G3–F#4', () => {
    for (const tonic of [...MAJOR_TONICS, ...MINOR_TONICS]) {
      expect(tonicMidi(major(tonic))).toBeGreaterThanOrEqual(55)
      expect(tonicMidi(major(tonic))).toBeLessThanOrEqual(66)
    }
  })
})

describe('scaleNotes (minor)', () => {
  it('A natural minor', () => {
    const notes = scaleNotes(minor('A'))
    expect(notes.map((n) => n.pc)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    expect(notes.map((n) => n.solfege)).toEqual(['Do', 'Re', 'Me', 'Fa', 'Sol', 'Le', 'Te'])
  })

  it('harmonic ยกขั้น 7 และ melodic ยกขั้น 6, 7', () => {
    expect(scaleNotes(minor('A', 'harmonic')).map((n) => n.pc)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#'])
    expect(scaleNotes(minor('A', 'melodic')).map((n) => n.solfege)).toEqual(['Do', 'Re', 'Me', 'Fa', 'Sol', 'La', 'Ti'])
  })

  it('สะกด double sharp ได้ (G# harmonic minor มี F𝄪)', () => {
    const pcs = scaleNotes(minor('G#', 'harmonic')).map((n) => n.pc)
    expect(pcs[6]).toBe('F##')
    expect(prettyNote(pcs[6])).toBe('F𝄪')
  })

  it('ขั้นห่างถูกต้องทุกคีย์', () => {
    for (const tonic of MINOR_TONICS) {
      expect(steps(minor(tonic))).toEqual([2, 1, 2, 2, 1, 2, 2])
      expect(steps(minor(tonic, 'harmonic'))).toEqual([2, 1, 2, 2, 1, 3, 1])
      expect(steps(minor(tonic, 'melodic'))).toEqual([2, 1, 2, 2, 2, 2, 1])
    }
  })
})

describe('keyInfo', () => {
  it('คืน key signature ตามลำดับมาตรฐาน', () => {
    expect(keyInfo(major('D')).accidentals).toEqual(['F#', 'C#'])
    expect(keyInfo(major('Eb')).accidentals).toEqual(['Bb', 'Eb', 'Ab'])
    expect(keyInfo(major('C')).accidentals).toEqual([])
    expect(keyInfo(major('A')).relative).toBe('F♯ minor')
  })

  it('ไมเนอร์ทุกแบบใช้ signature ของ natural minor', () => {
    expect(keyInfo(minor('E', 'harmonic')).accidentals).toEqual(['F#'])
    expect(keyInfo(minor('C')).accidentals).toEqual(['Bb', 'Eb', 'Ab'])
    expect(keyInfo(minor('C')).relative).toBe('E♭ Major')
  })
})

describe('matchTonic', () => {
  it('หาชื่อคีย์ที่เสียงเดียวกันในอีกโหมด', () => {
    expect(matchTonic('C', 'minor')).toBe('C')
    expect(matchTonic('Db', 'minor')).toBe('C#')
    expect(matchTonic('G#', 'major')).toBe('Ab')
  })
})

describe('labels', () => {
  it('แสดงชื่อได้สามแบบ', () => {
    const note = { degree: 5, pc: 'Bb', solfege: 'Sol' }
    expect(noteLabel(note, 'degree')).toBe('5')
    expect(noteLabel(note, 'solfege')).toBe('Sol')
    expect(noteLabel(note, 'note')).toBe('B♭')
    expect(prettyNote('B')).toBe('B')
  })

  it('ชื่อคีย์', () => {
    expect(keyName(major('Bb'))).toBe('B♭ Major')
    expect(keyName(minor('F#', 'harmonic'))).toBe('F♯ harmonic minor')
  })
})
