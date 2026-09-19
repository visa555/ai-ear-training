import { starsFor, statsByDegree, type Answer, type QuizConfig } from '../quiz/generator'
import { keyName, scaleNotes } from '../theory/keys'
import { Mascot } from './Mascot'

interface Props {
  config: QuizConfig
  answers: Answer[]
  onRetry: () => void
  onSetup: () => void
}

const MESSAGE: Record<1 | 2 | 3, string> = {
  3: 'สุดยอดไปเลย! หูทองของแท้ ลองด่านที่ยากขึ้นดูไหม? 🦅',
  2: 'เก่งมาก! อีกนิดเดียวก็ได้ 3 ดาวแล้ว ✨',
  1: 'เก่งมากที่เล่นจนจบ! ลองไปฟังโน้ตในหน้า “รู้จักโน้ต” แล้วกลับมาเล่นใหม่นะ 💪',
}

export function QuizSummary({ config, answers, onRetry, onSetup }: Props) {
  const correct = answers.filter((a) => a.correct).length
  const pct = Math.round((correct / answers.length) * 100)
  const stars = starsFor(pct)
  const timeouts = answers.filter((a) => a.chosen === 0).length
  const notes = scaleNotes(config.key)

  return (
    <div className="card summary">
      <div className="stars" aria-label={`ได้ ${stars} ดาว จาก 3 ดาว`}>
        {[1, 2, 3].map((s) => (
          <span key={s} className={s <= stars ? 'star on' : 'star'} style={{ animationDelay: `${s * 0.2}s` }}>
            ★
          </span>
        ))}
      </div>
      <p className="summary-score">
        ตอบถูก <b>{correct}</b> จาก {answers.length} ข้อ
      </p>
      <p className="muted center">
        คีย์ {keyName(config.key)}
        {timeouts > 0 && <> · ⏰ หมดเวลา {timeouts} ข้อ</>}
      </p>

      <Mascot mood={stars === 2 ? 'happy' : 'cheer'}>{MESSAGE[stars]}</Mascot>

      <h3>โน้ตแต่ละตัวเป็นยังไงบ้าง</h3>
      <table className="stats">
        <tbody>
          {statsByDegree(answers).map((s) => {
            const p = Math.round((s.correct / s.total) * 100)
            return (
              <tr key={s.degree}>
                <th>
                  <span className={`chip deg-${s.degree}`}>{notes[s.degree - 1].solfege}</span>
                </th>
                <td className="bar-cell">
                  <div className="bar">
                    <div style={{ width: `${Math.max(p, 4)}%` }} className={`deg-${s.degree}`} />
                  </div>
                </td>
                <td className="num">
                  {s.correct}/{s.total} {p === 100 ? '🌟' : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="actions center">
        <button className="primary" onClick={onRetry}>
          🔁 เล่นอีกรอบ
        </button>
        <button onClick={onSetup}>🎯 เปลี่ยนด่าน / คีย์</button>
      </div>
    </div>
  )
}
