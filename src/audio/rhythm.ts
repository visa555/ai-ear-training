import * as Tone from 'tone'
import { buildRhythmSchedule, type BeatTick, type ScheduleInput } from '../rhythm/logic'

/** ระดับเสียงโน้ตที่ใช้ฝึกจังหวะ (ระดับเดียวตลอด ให้เด็กสนใจแค่ความยาว) */
const NOTE_PITCH = 'A4'
/** เผื่อเวลาเล็กน้อยก่อนเสียงแรก ให้ Web Audio จองเวลาได้ทัน */
const LEAD_IN = 0.15

interface Active {
  nodes: { dispose: () => void }[]
  timers: number[]
  resolve?: (finished: boolean) => void
}

let active: Active | null = null

function release(a: Active) {
  a.timers.forEach((t) => window.clearTimeout(t))
  for (const node of a.nodes) {
    try {
      node.dispose()
    } catch {
      // ถูก dispose ไปแล้ว
    }
  }
}

/** หยุดจังหวะที่กำลังเล่น (เสียงที่จองไว้ล่วงหน้าจะไม่ดัง เพราะเครื่องเสียงถูกทิ้งไปทั้งชุด) */
export function stopRhythm() {
  if (!active) return
  const a = active
  active = null
  release(a)
  a.resolve?.(false)
}

export interface RhythmCallbacks {
  /** เรียกทุกจังหวะ (นับนำและในห้องโน้ต) ใช้ขยับภาพให้ตรงกับเสียง */
  onBeat?: (tick: BeatTick) => void
  /** เรียกเมื่อเสียงโน้ตเริ่ม (true) และหยุด (false) */
  onSound?: (sounding: boolean) => void
}

/**
 * เล่นนับนำ + โน้ต 1 ห้อง โดยจองเวลาทุกเสียงบนนาฬิกาของ Web Audio (แม่นยำระดับมิลลิวินาที)
 * ต้องเรียก ensureAudio() ก่อน · คืนค่า true เมื่อเล่นจบ, false ถ้าถูกหยุดกลางทาง
 */
export function playRhythm(input: ScheduleInput, callbacks: RhythmCallbacks = {}): Promise<boolean> {
  stopRhythm()
  const schedule = buildRhythmSchedule(input)

  // เสียงเคาะ: noise สั้นๆ ผ่าน band-pass คล้ายเคาะไม้ ไม่มีระดับเสียงชัด จึงไม่รบกวนการฝึกหู
  const clickFilter = new Tone.Filter(2600, 'bandpass').toDestination()
  const click = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: { attack: 0.001, decay: 0.045, sustain: 0, release: 0.01 },
  }).connect(clickFilter)
  click.volume.value = 2

  // เสียงโน้ต: ดังค้างเท่าเดิมจนจบ แล้วหยุดชัด ได้ยินความยาวชัดกว่าเสียงเปียโนที่ค่อยๆ เบาลง
  const tone = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.08, sustain: 0.85, release: 0.05 },
  }).toDestination()
  tone.volume.value = -6

  const a: Active = { nodes: [click, clickFilter, tone], timers: [] }
  active = a
  const start = Tone.now() + LEAD_IN
  const at = (time: number, fn: () => void) =>
    a.timers.push(window.setTimeout(fn, Math.max(0, (start + time - Tone.now()) * 1000)))

  for (const tick of schedule.beats) {
    if (tick.click) {
      const velocity = tick.accent ? 1 : tick.phase === 'count' ? 0.6 : 0.35
      click.triggerAttackRelease(0.04, start + tick.time, velocity)
    }
    at(tick.time, () => callbacks.onBeat?.(tick))
  }
  for (const s of schedule.sounds) {
    tone.triggerAttackRelease(NOTE_PITCH, s.duration, start + s.time)
    at(s.time, () => callbacks.onSound?.(true))
    at(s.time + s.duration, () => callbacks.onSound?.(false))
  }

  return new Promise((resolve) => {
    a.resolve = resolve
    at(schedule.total, () => {
      if (active !== a) return
      active = null
      resolve(true)
      // รอเสียงท้ายจางก่อนทิ้งเครื่องเสียง
      window.setTimeout(() => release(a), 400)
    })
  })
}
