import * as Tone from 'tone'

/** ตัวอย่างเสียงกีตาร์โปร่งจากชุด tonejs-instruments (ฟรี) */
const SAMPLE_BASE_URL = 'https://cdn.jsdelivr.net/gh/nbrosowsky/tonejs-instruments@master/samples/guitar-acoustic/'
const SAMPLE_NOTES = ['E2', 'A2', 'D3', 'G3', 'B3', 'E4', 'A4', 'C5']
const LOAD_TIMEOUT_MS = 20000

export type GuitarStatus = 'idle' | 'loading' | 'guitar' | 'fallback'

let instrument: Tone.Sampler | Tone.PolySynth | null = null
let ready: Promise<GuitarStatus> | null = null

let status: GuitarStatus = 'idle'
const listeners = new Set<() => void>()

function setStatus(next: GuitarStatus) {
  status = next
  listeners.forEach((l) => l())
}

export function getGuitarStatus(): GuitarStatus {
  return status
}

export function subscribeGuitarStatus(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function loadSampler(): Promise<Tone.Sampler> {
  return new Promise((resolve, reject) => {
    const sampler: Tone.Sampler = new Tone.Sampler({
      urls: Object.fromEntries(SAMPLE_NOTES.map((n) => [n, `${n}.mp3`])),
      baseUrl: SAMPLE_BASE_URL,
      release: 0.6,
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
      reject(new Error('Guitar samples timed out'))
    }, LOAD_TIMEOUT_MS)
  })
}

/** เสียงสำรองแบบดีด ใช้เมื่อโหลดตัวอย่างเสียงกีตาร์ไม่สำเร็จ */
function createFallback(): Tone.PolySynth {
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 1.2, sustain: 0.05, release: 0.8 },
  }).toDestination()
  synth.volume.value = -8
  return synth
}

/** ต้องเรียกจาก event ที่ผู้ใช้คลิก/แตะ · โหลดเสียงกีตาร์ครั้งแรกครั้งเดียว */
export function ensureGuitar(): Promise<GuitarStatus> {
  void Tone.start()
  ready ??= (async () => {
    setStatus('loading')
    try {
      instrument = await loadSampler()
      setStatus('guitar')
    } catch {
      instrument = createFallback()
      setStatus('fallback')
    }
    return status
  })()
  return ready
}

export function playGuitarNote(midi: number, duration = 1.8) {
  instrument?.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration, Tone.now(), 0.85)
}

/** ดีดไล่ทีละสาย (ใช้ตอนฟังสายเปล่าทั้ง 6 สาย) */
export function strumNotes(midis: number[], gap = 0.45, duration = 1.8) {
  if (!instrument) return
  const start = Tone.now()
  midis.forEach((midi, i) => {
    instrument?.triggerAttackRelease(Tone.Frequency(midi, 'midi').toNote(), duration, start + i * gap, 0.85)
  })
}

export function stopGuitar() {
  instrument?.releaseAll()
}
