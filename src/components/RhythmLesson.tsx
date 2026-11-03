import { useEffect, useState, type ReactNode } from 'react'
import { ensureAudio, stopAll } from '../audio/engine'
import { playRhythm } from '../audio/rhythm'
import { PENDING_TICK, type BeatTick } from '../rhythm/logic'
import { RHYTHM_ORDER, RHYTHMS, type RhythmValue } from '../rhythm/values'
import { BeatDots } from './BeatDots'
import { Mascot } from './Mascot'
import { RhythmGlyph } from './RhythmGlyph'
import { ToggleSwitch } from './ToggleSwitch'

export function RhythmLesson() {
  const [playing, setPlaying] = useState<RhythmValue | null>(null)
  const [shown, setShown] = useState<RhythmValue | null>(null)
  const [tick, setTick] = useState<BeatTick | null>(null)
  const [clicks, setClicks] = useState(true)
  const [speech, setSpeech] = useState<ReactNode>(
    <>
      ดนตรีมี<b>จังหวะ</b>เหมือนเสียงเท้าเดิน “ตึก ตึก ตึก ตึก” 🦶 โน้ตแต่ละตัวยาวไม่เท่ากัน ลองแตะการ์ดข้างล่างเพื่อฟังดูนะ
    </>,
  )

  useEffect(() => stopAll, [])

  const play = async (value: RhythmValue) => {
    const info = RHYTHMS[value]
    await ensureAudio()
    setPlaying(value)
    setShown(value)
    setTick(PENDING_TICK)
    setSpeech(
      <>
        ฟังเสียงเคาะนับ 1 2 3 4 ก่อน แล้วนับต่อในใจนะ… นี่คือ <b className={`chip ${info.color}`}>{info.name}</b> ยาว{' '}
        {info.beatsLabel} พูดตามว่า “<b>{info.syllable}</b>” {info.animal}
      </>,
    )
    const finished = await playRhythm({ value, clicks }, { onBeat: setTick })
    if (finished) {
      setTick(null)
      setPlaying(null)
    }
  }

  return (
    <>
      <h2 className="section-title">🥁 จังหวะโน้ต</h2>
      <Mascot mood={playing ? 'listen' : 'idle'}>{speech}</Mascot>

      <div className="card">
        <div className="rhythm-stage">
          {shown ? <RhythmGlyph value={shown} className={`big ${RHYTHMS[shown].color}`} /> : <span className="stage-hint">🎵</span>}
          <BeatDots tick={tick} fill={shown} />
        </div>

        <div className="rhythm-cards">
          {RHYTHM_ORDER.map((value) => {
            const info = RHYTHMS[value]
            return (
              <button
                key={value}
                className={`rhythm-card ${info.color}${playing === value ? ' playing' : ''}`}
                onClick={() => play(value)}
              >
                <RhythmGlyph value={value} />
                <span className="rc-name">{info.name}</span>
                <span className="rc-beats">{info.beatsLabel}</span>
                <span className="rc-syllable">
                  “{info.syllable}” {info.animal}
                </span>
              </button>
            )
          })}
        </div>

        <ToggleSwitch checked={clicks} onChange={setClicks}>
          🥢 <b>เคาะจังหวะระหว่างโน้ตดัง</b>
          <small>ช่วยให้นับได้ว่าเสียงยาวกี่จังหวะ</small>
        </ToggleSwitch>

        <div className="lesson-cards">
          <div className="lesson-card">
            <h3>👂 ฟังยังไง</h3>
            <p>เสียงเคาะ 4 ครั้งแรกคือ “นับนำ” บอกว่า 1 จังหวะยาวแค่ไหน</p>
            <p>จากนั้นนับต่อ 1 2 3 4 แล้วดูว่าเสียงโน้ตดังค้างไปถึงจังหวะที่เท่าไร</p>
          </div>
          <div className="lesson-card">
            <h3>👀 ดูรูปยังไง</h3>
            <p>
              <b>หัวโปร่ง</b> = ยาว (ตัวกลม ตัวขาว) · <b>หัวทึบ</b> = สั้น (ตัวดำ)
            </p>
            <p>ตัวกลมไม่มีหาง ตัวขาวมีหาง · เขบ็ตมีคานเชื่อมเป็นคู่ หรือมีธงถ้าอยู่ตัวเดียว</p>
          </div>
          <div className="lesson-card">
            <h3>🔵 โน้ตประจุด</h3>
            <p>
              <b>จุดข้างหัวโน้ต</b> = เพิ่มความยาวอีก<b>ครึ่งหนึ่ง</b>ของตัวเอง
            </p>
            <p>ตัวขาว 2 + จุด 1 = <b>3 จังหวะ</b> 🦒</p>
            <p>ตัวดำ 1 + จุด ½ = <b>1½ จังหวะ</b> เลยมักมาคู่กับเขบ็ต ½ ให้ครบ 2 จังหวะ “ทา–อิ ทิ” 🐇</p>
          </div>
          <div className="lesson-card">
            <h3>👏 ลองปรบมือ</h3>
            <p>ปรบมือ 1 ครั้งตอนเสียงเริ่ม แล้วกำมือค้างไว้จนเสียงหยุด</p>
            <p>เขบ็ต 1 ชั้นปรบเร็วๆ 2 ครั้งใน 1 จังหวะ “ทิ-ทิ”</p>
          </div>
        </div>
      </div>
    </>
  )
}
