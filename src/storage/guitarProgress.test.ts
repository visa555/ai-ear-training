import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearGuitarProgress, loadGuitarProgress, recordGuitarSession } from './guitarProgress'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  })
})

describe('guitar progress', () => {
  it('ยังไม่มีข้อมูลคืนค่าว่าง', () => {
    expect(loadGuitarProgress()).toEqual({ byPosition: {}, sessions: [] })
  })

  it('สะสมผลแยกตามช่อง และเก็บรอบใหม่ไว้หน้าสุด', () => {
    recordGuitarSession('ระดับ 2', 'find', [
      { position: '6-3', correct: true },
      { position: '1-5', correct: false },
    ])
    recordGuitarSession('ระดับ 3', 'name', [
      { position: '6-3', correct: false },
      { position: '5-0', correct: true },
    ])
    const p = loadGuitarProgress()
    expect(p.byPosition).toEqual({
      '6-3': { correct: 1, total: 2 },
      '1-5': { correct: 0, total: 1 },
      '5-0': { correct: 1, total: 1 },
    })
    expect(p.sessions.map((s) => `${s.level}:${s.mode}`)).toEqual(['ระดับ 3:name', 'ระดับ 2:find'])
    expect(p.sessions[1]).toMatchObject({ correct: 1, total: 2 })
  })

  it('ล้างข้อมูลได้ และข้อมูลเสียไม่ทำให้พัง', () => {
    recordGuitarSession('ระดับ 1', 'find', [{ position: '6-0', correct: true }])
    clearGuitarProgress()
    expect(loadGuitarProgress().sessions).toEqual([])

    localStorage.setItem('ear-training:guitar:v1', '{"byPosition":123}')
    expect(loadGuitarProgress()).toEqual({ byPosition: {}, sessions: [] })
  })
})
