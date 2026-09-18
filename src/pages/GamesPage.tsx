import { useState } from 'react'
import { stopAll } from '../audio/engine'
import { Mascot } from '../components/Mascot'
import type { KeyDef, LabelMode } from '../theory/keys'
import { EchoPage } from './EchoPage'
import { QuizPage } from './QuizPage'
import { ReadingPage } from './ReadingPage'

interface Props {
  keyDef: KeyDef
  onKeyChange: (key: KeyDef) => void
  labelMode: LabelMode
  onLabelModeChange: (mode: LabelMode) => void
}

type Game = 'quiz' | 'echo' | 'reading'

const GAMES: { value: Game; icon: string; title: string; desc: string }[] = [
  { value: 'quiz', icon: '🎯', title: 'เกมทายโน้ต', desc: 'ฟังโน้ตที่ซ่อนอยู่ แล้วทายว่าเป็นตัวไหน' },
  { value: 'echo', icon: '🦉', title: 'เลียนเสียงน้องฮูก', desc: 'ฟังทำนอง แล้วกดตามให้ถูก ยิ่งเล่นยิ่งยาวขึ้น!' },
  { value: 'reading', icon: '🎼', title: 'พาโน้ตกลับบ้าน', desc: 'อ่านโน้ตบนบรรทัด 5 เส้น แล้วบอกชื่อให้ถูก' },
]

export function GamesPage(props: Props) {
  const [game, setGame] = useState<Game | null>(null)

  const back = (
    <button
      className="ghost small back"
      onClick={() => {
        stopAll()
        setGame(null)
      }}
    >
      ← เลือกเกมอื่น
    </button>
  )

  if (game === 'quiz') {
    return (
      <section className="page">
        {back}
        <QuizPage {...props} />
      </section>
    )
  }

  if (game === 'echo') {
    return (
      <section className="page">
        {back}
        <EchoPage keyDef={props.keyDef} onKeyChange={props.onKeyChange} labelMode={props.labelMode} />
      </section>
    )
  }

  if (game === 'reading') {
    return (
      <section className="page">
        {back}
        <ReadingPage />
      </section>
    )
  }

  return (
    <section className="page">
      <Mascot mood="cheer">วันนี้อยากเล่นเกมไหนดี? เลือกได้เลย! 🎮</Mascot>
      <div className="game-cards">
        {GAMES.map((g) => (
          <button key={g.value} className="game-card" onClick={() => setGame(g.value)}>
            <span className="game-icon" aria-hidden>
              {g.icon}
            </span>
            <span className="game-title">{g.title}</span>
            <span className="game-desc">{g.desc}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
