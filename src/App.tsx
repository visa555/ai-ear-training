import { useState } from 'react'
import { stopAll, type AudioStatus } from './audio/engine'
import { useAudioStatus } from './audio/useAudio'
import { ExplorerPage } from './pages/ExplorerPage'
import { QuizPage } from './pages/QuizPage'
import { StatsPage } from './pages/StatsPage'
import { TipsPage } from './pages/TipsPage'
import type { KeyDef, LabelMode } from './theory/keys'

type Tab = 'explore' | 'quiz' | 'stats' | 'tips'

const TABS: { value: Tab; icon: string; label: string }[] = [
  { value: 'explore', icon: '🎹', label: 'รู้จักโน้ต' },
  { value: 'quiz', icon: '🎯', label: 'เกมทายโน้ต' },
  { value: 'stats', icon: '⭐', label: 'ผลงานของฉัน' },
  { value: 'tips', icon: '💡', label: 'เคล็ดลับ' },
]

const STATUS_TEXT: Record<AudioStatus, string> = {
  idle: 'กดปุ่มเล่นเสียงได้เลย 🎶',
  loading: 'กำลังเตรียมเปียโน… รอแป๊บนึงนะ',
  piano: '🎹 เปียโนพร้อมแล้ว!',
  synth: '🔈 ใช้เสียงเปียโนจำลองแทน (โหลดเปียโนจริงไม่สำเร็จ)',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('explore')
  const [keyDef, setKeyDef] = useState<KeyDef>({ tonic: 'C', mode: 'major' })
  const [labelMode, setLabelMode] = useState<LabelMode>('solfege')
  const status = useAudioStatus()

  const shared = { keyDef, onKeyChange: setKeyDef, labelMode, onLabelModeChange: setLabelMode }

  const switchTab = (next: Tab) => {
    stopAll()
    setTab(next)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo" aria-hidden>
            🦉
          </span>
          <div>
            <h1>
              หูทองน้อย <span className="notes" aria-hidden>♪♫</span>
            </h1>
            <p className={`status ${status}`}>{STATUS_TEXT[status]}</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.value} className={tab === t.value ? 'selected' : ''} onClick={() => switchTab(t.value)}>
              <span className="tab-icon" aria-hidden>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'explore' && <ExplorerPage {...shared} />}
        {tab === 'quiz' && <QuizPage {...shared} />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'tips' && <TipsPage />}
      </main>

      <footer className="app-footer">
        ไม่มีเสียง? ลองเปิดเสียงเครื่อง หรือปิดโหมดเงียบของ iPhone (สวิตช์ข้างเครื่อง) · เสียงเปียโน: Salamander Grand Piano
      </footer>
    </div>
  )
}
