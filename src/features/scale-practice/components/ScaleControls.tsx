import { NOTE_NAMES } from '../../../lib/music/notes'
import { SCALES } from '../../../lib/music/scales'
import type { Position } from '../../../lib/music/patterns'
import type { LabelMode } from './Fretboard'

interface HeroSelectProps {
  label: string
  value: string | number
  onChange: (value: string) => void
  children: React.ReactNode
}

/** Large select used in the hero panel: dark fill, glowing bottom border on focus. */
function HeroSelect({ label, value, onChange, children }: HeroSelectProps) {
  return (
    <div className="flex flex-col w-full sm:w-auto sm:min-w-[160px]">
      <label className="font-mono text-label-sm uppercase text-outline mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-surface-container text-on-surface font-mono text-label-sm rounded-t-lg border-0 border-b-2 border-outline focus:border-primary outline-none px-4 py-2.5 pr-9 cursor-pointer transition-colors"
        >
          {children}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-outline-variant">
          expand_more
        </span>
      </div>
    </div>
  )
}

interface CompactSelectProps extends HeroSelectProps {
  accent?: boolean
}

/** Small outlined select used in the fretboard settings row. */
function CompactSelect({ label, value, onChange, accent, children }: CompactSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="font-mono text-label-sm uppercase text-outline">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`appearance-none bg-transparent border border-outline-variant rounded px-3 py-1 pr-7 font-mono text-label-sm outline-none hover:bg-surface-container-high focus:border-primary cursor-pointer transition-colors ${
            accent ? 'text-primary' : 'text-on-surface'
          }`}
        >
          {children}
        </select>
        <span
          className={`material-symbols-outlined absolute right-1 top-1 text-sm pointer-events-none ${
            accent ? 'text-primary' : 'text-on-surface-variant'
          }`}
        >
          arrow_drop_down
        </span>
      </div>
    </div>
  )
}

interface ScaleSelectsProps {
  rootPc: number
  scaleId: string
  onRootChange: (pc: number) => void
  onScaleChange: (id: string) => void
}

/** Root + Scale Type selects for the hero panel. */
export function ScaleSelects({ rootPc, scaleId, onRootChange, onScaleChange }: ScaleSelectsProps) {
  return (
    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
      <HeroSelect label="Root" value={rootPc} onChange={(v) => onRootChange(Number(v))}>
        {NOTE_NAMES.map((name, pc) => (
          <option key={pc} value={pc}>
            {name}
          </option>
        ))}
      </HeroSelect>
      <HeroSelect label="Scale Type" value={scaleId} onChange={onScaleChange}>
        {SCALES.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </HeroSelect>
    </div>
  )
}

interface BoardSettingsProps {
  positionIndex: number
  positions: Position[]
  capo: number
  labelMode: LabelMode
  onPositionChange: (index: number) => void
  onCapoChange: (fret: number) => void
  onLabelModeChange: (mode: LabelMode) => void
}

/** Position / Capo / Labels settings row above the fretboard. */
export function BoardSettings({
  positionIndex,
  positions,
  capo,
  labelMode,
  onPositionChange,
  onCapoChange,
  onLabelModeChange,
}: BoardSettingsProps) {
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-3 items-center px-2">
      <CompactSelect
        label="Position"
        value={positionIndex}
        onChange={(v) => onPositionChange(Number(v))}
        accent
      >
        {positions.map((p) => (
          <option key={p.index} value={p.index}>
            {p.label}
          </option>
        ))}
      </CompactSelect>
      <CompactSelect label="Capo" value={capo} onChange={(v) => onCapoChange(Number(v))}>
        {Array.from({ length: 10 }, (_, f) => (
          <option key={f} value={f}>
            {f === 0 ? 'None' : `Fret ${f}`}
          </option>
        ))}
      </CompactSelect>
      <CompactSelect
        label="Labels"
        value={labelMode}
        onChange={(v) => onLabelModeChange(v as LabelMode)}
      >
        <option value="degree">Scale Degrees</option>
        <option value="name">Note Names</option>
      </CompactSelect>
    </div>
  )
}
