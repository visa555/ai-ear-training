/**
 * อ่าน/เขียน localStorage อย่างปลอดภัย: localStorage อาจใช้ไม่ได้ (private mode, ถูกบล็อก)
 * หรือข้อมูลอาจเสีย จึงต้องไม่ทำให้แอปพัง เพียงแต่ไม่มีข้อมูลสะสม
 */
export function readJSON<T>(key: string, isValid: (data: unknown) => data is T, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback()
    const data: unknown = JSON.parse(raw)
    return isValid(data) ? data : fallback()
  } catch {
    return fallback()
  }
}

export function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // บันทึกไม่ได้ก็ใช้งานต่อได้
  }
}

export function removeKey(key: string) {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const isObject = (data: unknown): data is Record<string, unknown> =>
  typeof data === 'object' && data !== null && !Array.isArray(data)
