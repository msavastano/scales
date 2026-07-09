import { NOTE_NAMES } from '../../../lib/music/notes'
import { SCALES } from '../../../lib/music/scales'
import type { Position } from '../../../lib/music/patterns'
import type { LabelMode } from './Fretboard'

interface ScaleControlsProps {
  rootPc: number
  scaleId: string
  positionIndex: number
  positions: Position[]
  capo: number
  labelMode: LabelMode
  onRootChange: (pc: number) => void
  onScaleChange: (id: string) => void
  onPositionChange: (index: number) => void
  onCapoChange: (fret: number) => void
  onLabelModeChange: (mode: LabelMode) => void
}

export function ScaleControls({
  rootPc,
  scaleId,
  positionIndex,
  positions,
  capo,
  labelMode,
  onRootChange,
  onScaleChange,
  onPositionChange,
  onCapoChange,
  onLabelModeChange,
}: ScaleControlsProps) {
  return (
    <div className="controls-row">
      <label className="control">
        <span>Root</span>
        <select value={rootPc} onChange={(e) => onRootChange(Number(e.target.value))}>
          {NOTE_NAMES.map((name, pc) => (
            <option key={pc} value={pc}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span>Scale</span>
        <select value={scaleId} onChange={(e) => onScaleChange(e.target.value)}>
          {SCALES.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span>Position</span>
        <select value={positionIndex} onChange={(e) => onPositionChange(Number(e.target.value))}>
          {positions.map((p) => (
            <option key={p.index} value={p.index}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span>Capo</span>
        <select value={capo} onChange={(e) => onCapoChange(Number(e.target.value))}>
          {Array.from({ length: 10 }, (_, f) => (
            <option key={f} value={f}>
              {f === 0 ? 'None' : `Fret ${f}`}
            </option>
          ))}
        </select>
      </label>

      <label className="control">
        <span>Labels</span>
        <select value={labelMode} onChange={(e) => onLabelModeChange(e.target.value as LabelMode)}>
          <option value="degree">Scale degrees</option>
          <option value="name">Note names</option>
        </select>
      </label>
    </div>
  )
}
