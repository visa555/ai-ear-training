/** สุ่มเลือกหนึ่งรายการตามน้ำหนัก (น้ำหนักมาก = มีโอกาสถูกเลือกมาก) */
export function weightedPick<T>(items: T[], weight: (item: T) => number, rng: () => number = Math.random): T {
  const weights = items.map(weight)
  let r = rng() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r < 0) return items[i]
  }
  return items[items.length - 1]
}
