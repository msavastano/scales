import type { MicDevice } from '../hooks/useTuner'

interface MicSelectorProps {
  devices: MicDevice[]
  /** Label of the device currently capturing */
  activeLabel: string | null
  onChange: (deviceId: string) => void
}

/** Compact microphone picker shown while listening; mirrors CompactSelect styling. */
export function MicSelector({ devices, activeLabel, onChange }: MicSelectorProps) {
  const activeId = devices.find((d) => d.label === activeLabel)?.deviceId ?? ''
  return (
    <div className="flex items-center gap-2">
      <label className="font-mono text-label-sm uppercase text-outline">Mic</label>
      <div className="relative">
        <select
          value={activeId}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none max-w-64 bg-transparent border border-outline-variant rounded px-3 py-1 pr-7 font-mono text-label-sm text-on-surface outline-none hover:bg-surface-container-high focus:border-primary cursor-pointer transition-colors truncate"
        >
          {activeId === '' && <option value="">Default</option>}
          {devices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-1 top-1 text-sm pointer-events-none text-on-surface-variant">
          arrow_drop_down
        </span>
      </div>
    </div>
  )
}
