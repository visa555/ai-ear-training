import { useState, type CSSProperties } from 'react'
import { Fretboard, type FretMark } from '../components/Fretboard'
import { Staff } from '../components/Staff'
import { MAX_FRET, noteAt } from '../guitar/fretboard'
import { fixedSolfege, naturalRange, shortPosition } from '../notation/staff'
import { starsFor, type Tally } from '../quiz/generator'
import { clearProgress, keyId, loadProgress, parseKeyId, type Progress } from '../storage/progress'
import { clearGuitarProgress, loadGuitarProgress, type GuitarMode, type GuitarProgress } from '../storage/guitarProgress'

const GUITAR_MODE_LABEL: Record<GuitarMode, string> = {
  find: 'หาโน้ตบนคอ',
  name: 'ช่องนี้ชื่ออะไร',
  listen: 'ฟังแล้วหาบนคอ',
}
import { clearReadingProgress, loadReadingProgress, type ReadingProgress } from '../storage/readingProgress'
import { DEGREES, keyName, MAJOR_TONICS, MINOR_TONICS, MODES, scaleNotes, type KeyDef } from '../theory/keys'

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
const pctOfTotals = (items: { correct: number; total: number }[]) => {
  const total = items.reduce((sum, s) => sum + s.total, 0)
  return total ? Math.round((items.reduce((sum, s) => sum + s.correct, 0) / total) * 100) : 0
}

/** เรียงคีย์ตาม mode แล้วตาม circle of fifths */
function sortKeys(keys: KeyDef[]): KeyDef[] {
  const modeIdx = (k: KeyDef) => MODES.findIndex((m) => m.value === k.mode)
  const tonicIdx = (k: KeyDef) => (k.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS).indexOf(k.tonic)
  return [...keys].sort((a, b) => modeIdx(a) - modeIdx(b) || tonicIdx(a) - tonicIdx(b))
}

/** โน้ตทุกตัวที่เกมอ่านโน้ตใช้ เรียงจากต่ำไปสูง */
const READING_ORDER = naturalRange('A3', 'A5')

const dateFmt = new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

function Legend() {
  return (
    <div className="legend" aria-label="คำอธิบายสี">
      {BINS.map((b, i) => (
        <span key={b.min}>
          <i className={`swatch bin-${i}`} /> {b.label}
        </span>
      ))}
    </div>
  )
}

function Tiles({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="tiles">
      {items.map((t) => (
        <div className="tile" key={t.label}>
          <span className="tile-label">{t.label}</span>
          <span className="tile-value">{t.value}</span>
        </div>
      ))}
    </div>
  )
}

function QuizStats({ progress }: { progress: Progress }) {
  const { sessions } = progress
  const keys = sortKeys(Object.keys(progress.byKey).map(parseKeyId))
  return (
    <>
      <h2 className="section-title">🎯 เกมทายโน้ต</h2>
      <Tiles
        items={[
          { label: '🎮 เล่นไปแล้ว (รอบ)', value: sessions.length },
          { label: '🎵 ทายโน้ต (ข้อ)', value: sessions.reduce((sum, s) => sum + s.total, 0) },
          { label: '🎯 ทายถูก', value: `${pctOfTotals(sessions)}%` },
        ]}
      />

      <div className="card">
        <h2>🗺️ โน้ตไหนเก่งแล้ว โน้ตไหนต้องฝึกอีก</h2>
        <p className="muted">สีบอกว่าทายถูกบ่อยแค่ไหน (ดูแถบสีข้างล่าง) · ขีด – คือยังไม่เคยเจอ · ชี้ที่ช่องเพื่อดูจำนวนครั้ง</p>
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
        <Legend />
      </div>

      <div className="card">
        <h2>📅 เล่นล่าสุด</h2>
        <ul className="history">
          {sessions.slice(0, 10).map((s) => (
            <li key={s.at}>
              <span className="muted">{dateFmt.format(new Date(s.at))}</span>
              <span>{keyName(s.key)}</span>
              <span className="num">
                {s.correct}/{s.total} {'★'.repeat(starsFor(Math.round((s.correct / s.total) * 100)))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function ReadingStats({ progress }: { progress: ReadingProgress }) {
  const { sessions, byNote } = progress
  const practiced = READING_ORDER.filter((n) => byNote[n.name]?.total)
  const staffStyle = { '--staff-min': `${practiced.length * 46 + 80}px` } as CSSProperties
  const weakest = [...practiced]
    .filter((n) => pctOf(byNote[n.name]) < 80)
    .sort((a, b) => pctOf(byNote[a.name]) - pctOf(byNote[b.name]))
    .slice(0, 3)

  return (
    <>
      <h2 className="section-title">🎼 อ่านโน้ต</h2>
      <Tiles
        items={[
          { label: '📖 อ่านไปแล้ว (รอบ)', value: sessions.length },
          { label: '🎵 อ่านโน้ต (ตัว)', value: sessions.reduce((sum, s) => sum + s.total, 0) },
          { label: '🎯 อ่านถูก', value: `${pctOfTotals(sessions)}%` },
        ]}
      />

      <div className="card">
        <h2>🔍 โน้ตตัวไหนอ่านแม่นแล้ว</h2>
        <p className="muted">สีหัวโน้ตบอกว่าอ่านถูกบ่อยแค่ไหน (ดูแถบสีข้างล่าง) · ตัวเลขใต้โน้ตคืออ่านถูกกี่เปอร์เซ็นต์ · ชี้ที่โน้ตเพื่อดูจำนวนครั้ง</p>
        <div className="staff-box staff-scroll" style={staffStyle}>
          <Staff
            colored={false}
            ariaLabel="ความแม่นยำในการอ่านโน้ตแต่ละตัว"
            notes={practiced.map((n) => {
              const t = byNote[n.name]
              const pct = pctOf(t)
              return {
                name: n.name,
                label: `${n.letter} ${pct}%`,
                className: `bin-${binOf(pct)}`,
                title: `${n.letter} (${fixedSolfege(n)}) ${shortPosition(n.pos)} · อ่านถูก ${t.correct} จาก ${t.total} ครั้ง`,
              }
            })}
          />
        </div>
        <Legend />
        {weakest.length > 0 && (
          <p className="focus-line">
            💪 ตัวที่ควรฝึกเพิ่ม:{' '}
            {weakest.map((n) => (
              <b key={n.name} className={`chip deg-${n.letterIndex + 1}`}>
                {n.letter} · {fixedSolfege(n)} <small>({shortPosition(n.pos)})</small>
              </b>
            ))}
          </p>
        )}
      </div>

      <div className="card">
        <h2>📅 อ่านล่าสุด</h2>
        <ul className="history">
          {sessions.slice(0, 10).map((s) => (
            <li key={s.at}>
              <span className="muted">{dateFmt.format(new Date(s.at))}</span>
              <span>🎼 {s.level}</span>
              <span className="num">
                {s.correct}/{s.total} {'★'.repeat(starsFor(Math.round((s.correct / s.total) * 100)))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

function GuitarStats({ progress }: { progress: GuitarProgress }) {
  const { sessions, byPosition } = progress
  const practiced = Object.entries(byPosition).filter(([, t]) => t.total > 0)

  const marks: Record<string, FretMark> = {}
  for (const [id, tally] of practiced) {
    const [string, fret] = id.split('-').map(Number)
    const note = noteAt(string, fret)
    const pct = pctOf(tally)
    marks[id] = {
      label: note.pc,
      className: `bin-${binOf(pct)}`,
      state: 'hint',
      title: `สาย ${string} เฟรต ${fret} (${note.pc}) · ถูก ${tally.correct} จาก ${tally.total} ครั้ง = ${pct}%`,
    }
  }

  const weakest = practiced
    .filter(([, t]) => pctOf(t) < 80)
    .sort((a, b) => pctOf(a[1]) - pctOf(b[1]))
    .slice(0, 3)
    .map(([id]) => {
      const [string, fret] = id.split('-').map(Number)
      return { id, string, fret, note: noteAt(string, fret) }
    })

  return (
    <>
      <h2 className="section-title">🎸 คอกีตาร์</h2>
      <Tiles
        items={[
          { label: '🎮 เล่นไปแล้ว (รอบ)', value: sessions.length },
          { label: '🎸 หาโน้ต (ข้อ)', value: sessions.reduce((sum, s) => sum + s.total, 0) },
          { label: '🎯 ตอบถูก', value: `${pctOfTotals(sessions)}%` },
        ]}
      />

      <div className="card">
        <h2>🗺️ ช่องไหนจำได้แล้ว ช่องไหนต้องฝึกอีก</h2>
        <p className="muted">สีบอกว่าตอบถูกบ่อยแค่ไหน (ดูแถบสีข้างล่าง) · ช่องว่างคือยังไม่เคยเจอ · ชี้ที่ช่องเพื่อดูจำนวนครั้ง</p>
        <div className="fretboard-scroll">
          <Fretboard frets={MAX_FRET} marks={marks} ariaLabel="ความแม่นยำของแต่ละช่องบนคอกีตาร์" />
        </div>
        <Legend />
        {weakest.length > 0 && (
          <p className="focus-line">
            💪 ช่องที่ควรฝึกเพิ่ม:{' '}
            {weakest.map((w) => (
              <b key={w.id} className={`chip deg-${w.note.letterIndex + 1}`}>
                {w.note.pc} <small>(สาย {w.string} เฟรต {w.fret})</small>
              </b>
            ))}
          </p>
        )}
      </div>

      <div className="card">
        <h2>📅 เล่นล่าสุด</h2>
        <ul className="history">
          {sessions.slice(0, 10).map((s) => (
            <li key={s.at}>
              <span className="muted">{dateFmt.format(new Date(s.at))}</span>
              <span>
                🎸 {s.level} · {GUITAR_MODE_LABEL[s.mode]}
              </span>
              <span className="num">
                {s.correct}/{s.total} {'★'.repeat(starsFor(Math.round((s.correct / s.total) * 100)))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export function StatsPage() {
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [reading, setReading] = useState<ReadingProgress>(loadReadingProgress)
  const [guitar, setGuitar] = useState<GuitarProgress>(loadGuitarProgress)
  const hasQuiz = progress.sessions.length > 0
  const hasReading = reading.sessions.length > 0
  const hasGuitar = guitar.sessions.length > 0

  const reset = () => {
    if (!window.confirm('ล้างผลงานทั้งหมด (ทุกเกม)? การกระทำนี้ย้อนกลับไม่ได้')) return
    clearProgress()
    clearReadingProgress()
    clearGuitarProgress()
    setProgress(loadProgress())
    setReading(loadReadingProgress())
    setGuitar(loadGuitarProgress())
  }

  if (!hasQuiz && !hasReading && !hasGuitar) {
    return (
      <section className="page">
        <div className="card empty">
          <div className="empty-icon" aria-hidden>
            🦉
          </div>
          <h2>ยังไม่มีผลงานเลย</h2>
          <p className="muted">ไปเล่นเกมทายโน้ตหรือเกมพาโน้ตกลับบ้านให้จบสักรอบ แล้วกลับมาดูผลงานที่นี่นะ!</p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      {hasQuiz ? <QuizStats progress={progress} /> : <p className="muted">🎯 ยังไม่ได้เล่นเกมทายโน้ต</p>}
      {hasReading ? <ReadingStats progress={reading} /> : <p className="muted">🎼 ยังไม่ได้เล่นเกมอ่านโน้ต</p>}
      {hasGuitar ? <GuitarStats progress={guitar} /> : <p className="muted">🎸 ยังไม่ได้เล่นเกมคอกีตาร์</p>}

      <div className="actions center">
        <button className="ghost danger" onClick={reset}>
          🗑️ ล้างผลงานทั้งหมด
        </button>
      </div>
    </section>
  )
}
