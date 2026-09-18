import { useState } from 'react'
import { stopAll, type AudioStatus } from './audio/engine'
import { useAudioStatus } from './audio/useAudio'
import { ExplorerPage } from './pages/ExplorerPage'
import { QuizPage } from './pages/QuizPage'
import { StatsPage } from './pages/StatsPage'
import type { KeyDef, LabelMode } from './theory/keys'

type Tab = 'explore' | 'quiz' | 'stats'

const TABS: { value: Tab; label: string }[] = [
  { value: 'explore', label: 'เรียนรู้คีย์' },
  { value: 'quiz', label: 'แบบทดสอบ' },
  { value: 'stats', label: 'สถิติ' },
]

const STATUS_TEXT: Record<AudioStatus, string> = {
  idle: 'เสียงจะเริ่มเมื่อกดเล่นครั้งแรก',
  loading: 'กำลังโหลดเสียงเปียโน…',
  piano: '🎹 เสียงเปียโนพร้อม',
  synth: '⚠︎ โหลดเสียงเปียโนไม่สำเร็จ กำลังใช้เสียงสังเคราะห์แทน',
}

export default function App() {
  const [tab, setTab] = useState<Tab>('explore')
  const [keyDef, setKeyDef] = useState<KeyDef>({ tonic: 'C', mode: 'major' })
  const [labelMode, setLabelMode] = useState<LabelMode>('degree')
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
            𝄞
          </span>
          <div>
            <h1>Ear Training</h1>
            <p className={`status ${status}`}>{STATUS_TEXT[status]}</p>
          </div>
        </div>
        <nav className="tabs">
          {TABS.map((t) => (
            <button key={t.value} className={tab === t.value ? 'selected' : ''} onClick={() => switchTab(t.value)}>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main>
        {tab === 'explore' && <ExplorerPage {...shared} />}
        {tab === 'quiz' && <QuizPage {...shared} />}
        {tab === 'stats' && <StatsPage />}
      </main>

      <footer className="app-footer">
        ใช้บน iPhone แล้วไม่มีเสียง? ลองปิดโหมดเงียบ (สวิตช์ข้างเครื่อง) · เสียงเปียโน: Salamander Grand Piano
      </footer>
    </div>
  )
}
