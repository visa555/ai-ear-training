import { useState } from 'react'
import { MAJOR_TONICS, MINOR_TONICS, MODES, DEGREES, keyName, scaleNotes, type KeyDef } from '../theory/keys'
import { clearProgress, keyId, loadProgress, parseKeyId, type Progress } from '../storage/progress'
import { starsFor, type Tally } from '../quiz/generator'

/** 5 ระดับของ sequential ramp (สีน้ำเงินอ่อน→เข้ม) ตามความแม่นยำ */
const BINS = [
  { min: 0, label: '0–19%' },
  { min: 20, label: '20–39%' },
  { min: 40, label: '40–59%' },
  { min: 60, label: '60–79%' },
  { min: 80, label: '80–100%' },
]

const binOf = (pct: number) => BINS.findLastIndex((b) => pct >= b.min)
const pctOf = (t: Tally) => Math.round((t.correct / t.total) * 100)

/** เรียงคีย์ตาม mode แล้วตาม circle of fifths */
function sortKeys(keys: KeyDef[]): KeyDef[] {
  const modeIdx = (k: KeyDef) => MODES.findIndex((m) => m.value === k.mode)
  const tonicIdx = (k: KeyDef) => (k.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS).indexOf(k.tonic)
  return [...keys].sort((a, b) => modeIdx(a) - modeIdx(b) || tonicIdx(a) - tonicIdx(b))
}

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

export function StatsPage() {
  const [progress, setProgress] = useState<Progress>(loadProgress)

  const sessions = progress.sessions
  const answered = sessions.reduce((sum, s) => sum + s.total, 0)
  const correct = sessions.reduce((sum, s) => sum + s.correct, 0)
  const keys = sortKeys(Object.keys(progress.byKey).map(parseKeyId))

  const reset = () => {
    if (!window.confirm('ล้างผลงานทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้')) return
    clearProgress()
    setProgress(loadProgress())
  }

  if (sessions.length === 0) {
    return (
      <section className="page">
        <div className="card empty">
          <div className="empty-icon" aria-hidden>
            🦉
          </div>
          <h2>ยังไม่มีผลงานเลย</h2>
          <p className="muted">ไปเล่นเกมทายโน้ตให้จบสักรอบ แล้วกลับมาดูผลงานที่นี่นะ!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <div className="tiles">
        <div className="tile">
          <span className="tile-label">🎮 เล่นไปแล้ว (รอบ)</span>
          <span className="tile-value">{sessions.length}</span>
        </div>
        <div className="tile">
          <span className="tile-label">🎵 ทายโน้ต (ข้อ)</span>
          <span className="tile-value">{answered}</span>
        </div>
        <div className="tile">
          <span className="tile-label">🎯 ทายถูก</span>
          <span className="tile-value">{Math.round((correct / answered) * 100)}%</span>
        </div>
      </div>

      <div className="card">
        <h2>🗺️ โน้ตไหนเก่งแล้ว โน้ตไหนต้องฝึกอีก</h2>
        <p className="muted">ยิ่งสีเข้ม ยิ่งทายถูกบ่อย · ขีด – คือยังไม่เคยเจอ · ชี้ที่ช่องเพื่อดูจำนวนครั้ง</p>
        <div className="heatmap-wrap">
          <table className="heatmap">
            <thead>
              <tr>
                <th scope="col">คีย์ / ตัวที่</th>
                {DEGREES.map((d) => (
                  <th key={d} scope="col">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => {
                const tallies = progress.byKey[keyId(key)]
                const notes = scaleNotes(key)
                return (
                  <tr key={keyId(key)}>
                    <th scope="row">{keyName(key)}</th>
                    {DEGREES.map((d) => {
                      const t = tallies[d]
                      if (!t?.total) {
                        return (
                          <td key={d} className="cell-empty">
                            –
                          </td>
                        )
                      }
                      const pct = pctOf(t)
                      return (
                        <td
                          key={d}
                          className={`bin-${binOf(pct)}`}
                          title={`ขั้นที่ ${d} (${notes[d - 1].solfege}) · ถูก ${t.correct} จาก ${t.total} ครั้ง`}
                        >
                          {pct}%
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="legend" aria-label="คำอธิบายสี">
          {BINS.map((b, i) => (
            <span key={b.min}>
              <i className={`swatch bin-${i}`} /> {b.label}
            </span>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>📅 เล่นล่าสุด</h2>
        <ul className="history">
          {sessions.slice(0, 15).map((s) => (
            <li key={s.at}>
              <span className="muted">{dateFmt.format(new Date(s.at))}</span>
              <span>{keyName(s.key)}</span>
              <span className="num">
                {s.correct}/{s.total} {'★'.repeat(starsFor(Math.round((s.correct / s.total) * 100)))}
              </span>
            </li>
          ))}
        </ul>
        <div className="actions">
          <button className="ghost danger" onClick={reset}>
            🗑️ ล้างผลงานทั้งหมด
          </button>
        </div>
      </div>
    </section>
  )
}
