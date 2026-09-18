import { useState } from 'react'
import { stopAll, type AudioStatus } from './audio/engine'
import { useAudioStatus } from './audio/useAudio'
import { TopNav, type NavItem } from './components/TopNav'
import { StaffLesson } from './components/StaffLesson'
import { ExplorerPage } from './pages/ExplorerPage'
import { GamesPage } from './pages/GamesPage'
import { StatsPage } from './pages/StatsPage'
import { TipsPage } from './pages/TipsPage'
import type { KeyDef, LabelMode } from './theory/keys'

type Tab = 'explore' | 'reading' | 'quiz' | 'stats' | 'tips'

const TABS: NavItem<Tab>[] = [
  { value: 'explore', icon: '🎹', label: 'รู้จักโน้ต' },
  { value: 'reading', icon: '🎼', label: 'อ่านโน้ต' },
  { value: 'quiz', icon: '🎮', label: 'เกม' },
  { value: 'stats', icon: '⭐', label: 'ผลงาน' },
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
      <TopNav items={TABS} current={tab} onSelect={switchTab} status={STATUS_TEXT[status]} statusClass={status} />

      <main>
        {tab === 'explore' && <ExplorerPage {...shared} />}
        {tab === 'reading' && (
          <section className="page">
            <StaffLesson />
          </section>
        )}
        {tab === 'quiz' && <GamesPage {...shared} />}
        {tab === 'stats' && <StatsPage />}
        {tab === 'tips' && <TipsPage />}
      </main>

      <footer className="app-footer">
        ไม่มีเสียง? ลองเปิดเสียงเครื่อง หรือปิดโหมดเงียบของ iPhone (สวิตช์ข้างเครื่อง) · เสียงเปียโน: Salamander Grand Piano
      </footer>
    </div>
  )
}
