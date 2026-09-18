import * as Tone from 'tone'

/** เสียงเปียโน Salamander Grand Piano (ฟรี) ที่ Tone.js โฮสต์ไว้ */
const SAMPLE_BASE_URL = 'https://tonejs.github.io/audio/salamander/'
const LOAD_TIMEOUT_MS = 15000

export type AudioStatus = 'idle' | 'loading' | 'piano' | 'synth'

export interface Step {
  midis: number[]
  /** ระยะเวลาที่โน้ตดัง (วินาที) */
  duration: number
  /** เวลาก่อนเริ่ม step ถัดไป (วินาที) ค่าเริ่มต้นเท่ากับ duration */
  next?: number
}

let instrument: Tone.Sampler | Tone.PolySynth | null = null
let ready: Promise<AudioStatus> | null = null
let generation = 0

let status: AudioStatus = 'idle'
const listeners = new Set<() => void>()

function setStatus(next: AudioStatus) {
  status = next
  listeners.forEach((l) => l())
}

export function getAudioStatus(): AudioStatus {
  return status
}

export function subscribeAudioStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function salamanderUrls(): Record<string, string> {
  const urls: Record<string, string> = {}
  for (let octave = 1; octave <= 7; octave++) {
    for (const note of ['C', 'D#', 'F#', 'A']) {
      urls[`${note}${octave}`] = `${note.replace('#', 's')}${octave}.mp3`
    }
  }
  return urls
}

function loadSampler(): Promise<Tone.Sampler> {
  return new Promise((resolve, reject) => {
    const sampler: Tone.Sampler = new Tone.Sampler({
      urls: salamanderUrls(),
      baseUrl: SAMPLE_BASE_URL,
      release: 1.2,
      onload: () => {
        clearTimeout(timer)
        resolve(sampler)
      },
      onerror: (err) => {
        clearTimeout(timer)
        sampler.dispose()
        reject(err)
      },
    }).toDestination()
    const timer = setTimeout(() => {
      sampler.dispose()
      reject(new Error('Piano samples timed out'))
    }, LOAD_TIMEOUT_MS)
  })
}

function createSynth(): Tone.PolySynth {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.3, sustain: 0.4, release: 1 },
  }).toDestination()
  synth.volume.value = -8
  return synth
}

/**
 * ต้องเรียกจาก event ที่ผู้ใช้คลิก/แตะ เพราะเบราว์เซอร์ไม่อนุญาตให้เล่นเสียงเอง
 * โหลดเสียงเปียโน ถ้าไม่สำเร็จจะใช้เสียงสังเคราะห์แทน
 */
export function ensureAudio(): Promise<AudioStatus> {
  void Tone.start()
  ready ??= (async () => {
    setStatus('loading')
    try {
      instrument = await loadSampler()
      setStatus('piano')
    } catch {
      instrument = createSynth()
      setStatus('synth')
    }
    return status
  })()
  return ready
}

const toNote = (midi: number) => Tone.Frequency(midi, 'midi').toNote()

export function playNotes(midis: number[], duration = 1) {
  if (!instrument || midis.length === 0) return
  instrument.triggerAttackRelease(midis.map(toNote), duration, Tone.now(), 0.8)
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * เล่นทีละ step ตามลำดับ การเรียกครั้งใหม่หรือ stopAll() จะยกเลิกลำดับเดิม
 * คืนค่า true ถ้าเล่นจนจบ
 */
export async function playSequence(steps: Step[], onStep?: (midis: number[]) => void): Promise<boolean> {
  const id = ++generation
  for (const step of steps) {
    if (id !== generation) return false
    playNotes(step.midis, step.duration)
    onStep?.(step.midis)
    await wait((step.next ?? step.duration) * 1000)
  }
  if (id !== generation) return false
  onStep?.([])
  return true
}

export function stopAll() {
  generation++
  instrument?.releaseAll()
}
