import { KID_TIPS, NOTE_FEELINGS, PARENT_TIPS, PRACTICE_PLAN } from '../content/tips'
import { Mascot } from '../components/Mascot'

export function TipsPage() {
  return (
    <section className="page">
      <Mascot mood="cheer">
        นี่คือ<b>เคล็ดลับฝึกหู</b>ของฉันเอง! ลองทำตามทีละข้อนะ แล้วหูจะเก่งขึ้นเรื่อยๆ 🦉✨
      </Mascot>

      <div className="card">
        <h2>🧒 เคล็ดลับสำหรับเด็กๆ</h2>
        <ol className="tip-list">
          {KID_TIPS.map((tip, i) => (
            <li key={tip.title} className={`tip deg-${(i % 7) + 1}`}>
              <span className="tip-icon" aria-hidden>
                {tip.icon}
              </span>
              <div>
                <h3>
                  {i + 1}. {tip.title}
                </h3>
                <p>{tip.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <h2>💭 โน้ตแต่ละตัวรู้สึกยังไง</h2>
        <p className="muted">ความรู้สึกเหล่านี้จะชัดขึ้นเมื่อฟังเพลงบอกบ้านก่อน ลองกดฟังในหน้า “รู้จักโน้ต” ดูนะ</p>
        <ul className="feelings">
          {NOTE_FEELINGS.map((n) => (
            <li key={n.degree}>
              <span className={`chip deg-${n.degree}`}>{n.name}</span>
              <span>{n.feeling}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="card more">
        <summary>👨‍👩‍👧 สำหรับผู้ปกครองและคุณครู</summary>
        <ul className="parent-tips">
          {PARENT_TIPS.map((tip) => (
            <li key={tip.title}>
              <span className="tip-icon small" aria-hidden>
                {tip.icon}
              </span>
              <div>
                <b>{tip.title}</b>
                <p>{tip.body}</p>
              </div>
            </li>
          ))}
        </ul>

        <h3>📅 ตัวอย่างแผนฝึก 4 สัปดาห์</h3>
        <table className="plan">
          <tbody>
            {PRACTICE_PLAN.map((p) => (
              <tr key={p.week}>
                <th scope="row">สัปดาห์ {p.week}</th>
                <td>{p.plan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  )
}
