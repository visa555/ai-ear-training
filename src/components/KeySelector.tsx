import { matchTonic, MODES, prettyNote, signatureShort, tonicsFor, type KeyDef } from '../theory/keys'

interface Props {
  value: KeyDef
  onChange: (key: KeyDef) => void
}

export function KeySelector({ value, onChange }: Props) {
  return (
    <div className="key-picker">
      <div className="segmented" role="radiogroup" aria-label="เลือกโหมด">
        {MODES.map((m) => (
          <button
            key={m.value}
            role="radio"
            aria-checked={m.value === value.mode}
            className={m.value === value.mode ? 'selected' : ''}
            onClick={() => onChange({ mode: m.value, tonic: matchTonic(value.tonic, m.value) })}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="key-selector" role="radiogroup" aria-label="เลือกคีย์">
        {tonicsFor(value.mode).map((tonic) => (
          <button
            key={tonic}
            role="radio"
            aria-checked={tonic === value.tonic}
            className={tonic === value.tonic ? 'selected' : ''}
            onClick={() => onChange({ ...value, tonic })}
          >
            <span className="key-name">
              {prettyNote(tonic)}
              {value.mode !== 'major' && <span className="key-minor">m</span>}
            </span>
            <span className="key-sig">{signatureShort({ ...value, tonic })}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
