import { statsByDegree, type Answer, type QuizConfig } from '../quiz/generator'
import { keyName, scaleNotes } from '../theory/keys'

interface Props {
  config: QuizConfig
  answers: Answer[]
  onRetry: () => void
  onSetup: () => void
}

function message(pct: number) {
  if (pct === 100) return 'สมบูรณ์แบบ! ลองเพิ่มขั้นหรือเปลี่ยนเป็น 2 ออคเทฟดู'
  if (pct >= 80) return 'เยี่ยมมาก! พร้อมขยับไประดับถัดไปแล้ว'
  if (pct >= 50) return 'ดีขึ้นเรื่อยๆ ฝึกขั้นที่ยังพลาดบ่อยต่ออีกนิด'
  return 'ค่อยเป็นค่อยไป ลองฟังสเกลในหน้าเรียนรู้คีย์ก่อนแล้วกลับมาใหม่'
}

export function QuizSummary({ config, answers, onRetry, onSetup }: Props) {
  const correct = answers.filter((a) => a.correct).length
  const pct = Math.round((correct / answers.length) * 100)
  const notes = scaleNotes(config.key)

  return (
    <div className="card">
      <h2>ผลลัพธ์ · {keyName(config.key)}</h2>
      <div className="score">
        <span className="score-num">
          {correct}/{answers.length}
        </span>
        <span className="score-pct">{pct}%</span>
      </div>
      <p>{message(pct)}</p>

      <h3>ความแม่นยำแยกตามขั้น</h3>
      <table className="stats">
        <tbody>
          {statsByDegree(answers).map((s) => {
            const p = Math.round((s.correct / s.total) * 100)
            return (
              <tr key={s.degree}>
                <th>
                  {s.degree} <small>{notes[s.degree - 1].solfege}</small>
                </th>
                <td className="bar-cell">
                  <div className="bar">
                    <div style={{ width: `${p}%` }} className={p >= 80 ? 'good' : p >= 50 ? 'ok' : 'bad'} />
                  </div>
                </td>
                <td className="num">
                  {s.correct}/{s.total}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="actions">
        <button className="primary" onClick={onRetry}>
          ทำอีกรอบ (ตั้งค่าเดิม)
        </button>
        <button onClick={onSetup}>เปลี่ยนการตั้งค่า</button>
      </div>
    </div>
  )
}
