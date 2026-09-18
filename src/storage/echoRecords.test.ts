import { beforeEach, describe, expect, it, vi } from 'vitest'
import { echoRecordId, loadEchoBest, saveEchoBest } from './echoRecords'

beforeEach(() => {
  const data = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  })
})

describe('echo records', () => {
  const id = echoRecordId({ tonic: 'C', mode: 'major' }, [1, 3, 5])

  it('แยกตามคีย์และด่าน', () => {
    expect(id).toBe('major:C:135')
  })

  it('บันทึกเฉพาะเมื่อทำลายสถิติ', () => {
    expect(loadEchoBest(id)).toBe(0)
    expect(saveEchoBest(id, 4)).toBe(true)
    expect(saveEchoBest(id, 3)).toBe(false)
    expect(saveEchoBest(id, 4)).toBe(false)
    expect(loadEchoBest(id)).toBe(4)
    expect(saveEchoBest(id, 6)).toBe(true)
    expect(loadEchoBest(id)).toBe(6)
  })

  it('localStorage ใช้ไม่ได้ก็ไม่พัง', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadEchoBest(id)).toBe(0)
    expect(() => saveEchoBest(id, 5)).not.toThrow()
  })
})
