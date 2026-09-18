import { useState } from 'react'
import { ensureAudio } from '../audio/engine'
import { EchoPlay, type EchoConfig } from '../components/EchoPlay'
import { KeySelector } from '../components/KeySelector'
import { Mascot } from '../components/Mascot'
import { LEVELS } from '../content/levels'
import { echoStars } from '../echo/logic'
import { echoRecordId, loadEchoBest, saveEchoBest } from '../storage/echoRecords'
import { keyName, scaleNotes, type KeyDef, type LabelMode } from '../theory/keys'

interface Props {
  keyDef: KeyDef
  onKeyChange: (key: KeyDef) => void
  labelMode: LabelMode
}

type Stage = { name: 'setup' } | { name: 'play'; config: EchoConfig; best: number; round: number } | {
  name: 'over'
  config: EchoConfig
  longest: number
  best: number
  isRecord: boolean
}

export function EchoPage({ keyDef, onKeyChange, labelMode }: Props) {
  const [degrees, setDegrees] = useState<number[]>([1, 3, 5])
  const [lights, setLights] = useState(true)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<Stage>({ name: 'setup' })
  const notes = scaleNotes(keyDef)
  const best = loadEchoBest(echoRecordId(keyDef, degrees))

  const begin = (config: EchoConfig, round = 0) =>
    setStage({ name: 'play', config, best: loadEchoBest(echoRecordId(config.key, config.degrees)), round })

  const start = async () => {
    setLoading(true)
    await ensureAudio()
    setLoading(false)
    begin({ key: keyDef, degrees, labelMode, lights })
  }

  if (stage.name === 'play') {
    return (
      <EchoPlay
        key={stage.round}
        config={stage.config}
        best={stage.best}
        onQuit={() => setStage({ name: 'setup' })}
        onFinish={(longest) => {
          const id = echoRecordId(stage.config.key, stage.config.degrees)
          const isRecord = saveEchoBest(id, longest)
          setStage({ name: 'over', config: stage.config, longest, best: loadEchoBest(id), isRecord })
        }}
      />
    )
  }

  if (stage.name === 'over') {
    const stars = echoStars(stage.longest)
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
          จำทำนองได้ยาวสุด <b>{stage.longest}</b> โน้ต
        </p>
        <p className="muted center">
          คีย์ {keyName(stage.config.key)} · สถิติสูงสุด {stage.best} โน้ต
        </p>
        {stage.isRecord && stage.longest > 0 && <p className="record">🏅 ทำลายสถิติใหม่!</p>}
        <Mascot mood="cheer">
          {stage.longest === 0
            ? 'เริ่มต้นได้ดีแล้ว! ลองเปิด “ให้เปียโนกระพริบตาม” แล้วเล่นอีกรอบนะ 💪'
            : stars === 3
              ? 'ความจำหูทองของแท้! ลองด่านที่ยากขึ้นดูไหม? 🦅'
              : 'เก่งมาก! เล่นอีกรอบ ทำนองจะจำได้ยาวขึ้นเรื่อยๆ ✨'}
        </Mascot>
        <div className="actions center">
          <button className="primary" onClick={() => begin(stage.config, Date.now())}>
            🔁 เล่นอีกรอบ
          </button>
          <button onClick={() => setStage({ name: 'setup' })}>🎯 เปลี่ยนด่าน / คีย์</button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Mascot mood="cheer">
        มาเล่น<b>เลียนเสียงน้องฮูก</b>กัน! ฉันจะเล่นทำนองสั้นๆ ให้ฟัง แล้วหนูกดตามให้ถูกลำดับนะ ถ้าถูก
        ทำนองจะยาวขึ้นทีละโน้ต มีหัวใจ ❤️❤️❤️ ให้ 3 ดวง
      </Mascot>

      <div className="card">
        <h2>1️⃣ เลือกด่าน</h2>
        <div className="levels">
          {LEVELS.map((level) => (
            <button
              key={level.name}
              className={`level${level.degrees.join() === degrees.join() ? ' selected' : ''}`}
              onClick={() => setDegrees(level.degrees)}
            >
              <span className="level-icon">{level.icon}</span>
              <span className="level-name">{level.name}</span>
              <span className="level-notes">
                {level.degrees.map((d) => (
                  <i key={d} className={`dot deg-${d}`} title={notes[d - 1].solfege} />
                ))}
              </span>
              <small>{level.degrees.map((d) => notes[d - 1].solfege).join(' ')}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>2️⃣ เลือกคีย์</h2>
        <KeySelector value={keyDef} onChange={onKeyChange} />
      </div>

      <div className="card">
        <label className="switch">
          <input type="checkbox" checked={lights} onChange={(e) => setLights(e.target.checked)} />
          <span>
            👀 <b>ให้เปียโนกระพริบตาม</b> (โหมดง่าย) · ปิดไว้ถ้าอยากฝึกฟังด้วยหูอย่างเดียว
          </span>
        </label>
        {best > 0 && <p className="record-line">🏅 สถิติสูงสุดของด่านและคีย์นี้: {best} โน้ต</p>}
      </div>

      <div className="start-row">
        <button className="primary huge" disabled={loading} onClick={start}>
          {loading ? '🎹 กำลังเตรียมเปียโน…' : '▶ เริ่มเล่นเลย!'}
        </button>
      </div>
    </>
  )
}
