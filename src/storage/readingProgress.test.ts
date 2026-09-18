import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearReadingProgress, loadReadingProgress, recordReadingSession } from './readingProgress'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  })
})

describe('reading progress', () => {
  it('ยังไม่มีข้อมูลคืนค่าว่าง', () => {
    expect(loadReadingProgress()).toEqual({ byNote: {}, sessions: [] })
  })

  it('สะสมผลแยกตามโน้ต (C4 กับ C5 แยกกัน) และเก็บรอบใหม่ไว้หน้าสุด', () => {
    recordReadingSession('ระดับ 1', [
      { note: 'C4', correct: true },
      { note: 'E4', correct: false },
    ])
    recordReadingSession('ระดับ 3', [
      { note: 'E4', correct: true },
      { note: 'C5', correct: true },
    ])
    const p = loadReadingProgress()
    expect(p.byNote).toEqual({
      C4: { correct: 1, total: 1 },
      E4: { correct: 1, total: 2 },
      C5: { correct: 1, total: 1 },
    })
    expect(p.sessions.map((s) => s.level)).toEqual(['ระดับ 3', 'ระดับ 1'])
    expect(p.sessions[1]).toMatchObject({ correct: 1, total: 2 })
  })

  it('ล้างข้อมูลได้ และข้อมูลเสียไม่ทำให้พัง', () => {
    recordReadingSession('ระดับ 1', [{ note: 'C4', correct: true }])
    clearReadingProgress()
    expect(loadReadingProgress().sessions).toEqual([])

    localStorage.setItem('ear-training:reading:v1', '["not", "an", "object"]')
    expect(loadReadingProgress()).toEqual({ byNote: {}, sessions: [] })
  })
})
