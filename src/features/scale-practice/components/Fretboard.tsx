import type { PatternNote } from '../../../lib/music/patterns'
import { INTERVAL_LABELS, midiPitchClass, pitchClassName } from '../../../lib/music/notes'
import type { ScaleDef } from '../../../lib/music/scales'

export type LabelMode = 'degree' | 'name'

interface FretboardProps {
  pattern: PatternNote[]
  scale: ScaleDef
  capo: number
  /** Index into pattern of the note to highlight, or null */
  currentIndex: number | null
  labelMode: LabelMode
  stringCount: number
}

const FRET_W = 64
const STRING_GAP = 30
const MARGIN_X = 44
const MARGIN_Y = 34
const INLAY_FRETS = [3, 5, 7, 9, 15, 17, 19, 21]

export function Fretboard({ pattern, scale, capo, currentIndex, labelMode, stringCount }: FretboardProps) {
  const maxPatternFret = pattern.reduce((m, n) => Math.max(m, capo + n.fret), 0)
  const fretCount = Math.max(12, Math.min(24, maxPatternFret + 1))

  const width = MARGIN_X * 2 + FRET_W * fretCount
  const height = MARGIN_Y * 2 + STRING_GAP * (stringCount - 1)

  const stringY = (s: number) => MARGIN_Y + (stringCount - 1 - s) * STRING_GAP
  // Center of a fret space; fret 0 (open/at capo) sits just left of the nut/capo line
  const fretX = (fret: number) => (fret === 0 ? MARGIN_X - 18 : MARGIN_X + (fret - 0.5) * FRET_W)
  const fretLineX = (fret: number) => MARGIN_X + fret * FRET_W

  const boardTop = MARGIN_Y - 12
  const boardHeight = STRING_GAP * (stringCount - 1) + 24
  // Gauge-weighted string thickness: low E thickest, high E thinnest
  const stringWeight = (s: number) => 4 - s * 0.55

  return (
    <div className="overflow-x-auto rounded-lg glass-panel p-3">
      <svg
        className="block h-auto w-full min-w-[760px]"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label="Guitar fretboard"
      >
        <defs>
          <linearGradient id="fb-wood-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#221e1a" />
            <stop offset="45%" stopColor="#1e1b18" />
            <stop offset="100%" stopColor="#161310" />
          </linearGradient>
          <linearGradient id="fb-nut-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d1d5db" />
            <stop offset="100%" stopColor="#9ca3af" />
          </linearGradient>
          <linearGradient id="fb-fret-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8d90a0" />
            <stop offset="50%" stopColor="#c3c6d7" />
            <stop offset="100%" stopColor="#8d90a0" />
          </linearGradient>
          <linearGradient id="fb-string-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a0aab5" />
            <stop offset="50%" stopColor="#6b7280" />
            <stop offset="100%" stopColor="#434655" />
          </linearGradient>
        </defs>

        {/* Board */}
        <rect x={MARGIN_X} y={boardTop} width={FRET_W * fretCount} height={boardHeight} rx={6} className="fb-wood" />

        {/* Inlays */}
        {INLAY_FRETS.filter((f) => f <= fretCount).map((f) => (
          <circle key={f} cx={fretX(f)} cy={height / 2} r={7} className="fb-inlay" />
        ))}
        {12 <= fretCount && (
          <>
            <circle cx={fretX(12)} cy={stringY(4) - STRING_GAP / 2} r={7} className="fb-inlay" />
            <circle cx={fretX(12)} cy={stringY(1) + STRING_GAP / 2} r={7} className="fb-inlay" />
          </>
        )}
        {24 <= fretCount && (
          <>
            <circle cx={fretX(24)} cy={stringY(4) - STRING_GAP / 2} r={7} className="fb-inlay" />
            <circle cx={fretX(24)} cy={stringY(1) + STRING_GAP / 2} r={7} className="fb-inlay" />
          </>
        )}

        {/* Nut (square-edged, silver) + fret wires (metallic) */}
        <rect x={fretLineX(0) - 8} y={boardTop} width={8} height={boardHeight} className="fb-nut" />
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((f) => (
          <rect
            key={f}
            x={fretLineX(f) - 1.25}
            y={boardTop}
            width={2.5}
            height={boardHeight}
            className="fb-fret"
          />
        ))}
        {Array.from({ length: fretCount }, (_, i) => i + 1).map((f) => (
          <text key={f} x={fretX(f)} y={height - 6} textAnchor="middle" className="fb-fretnum">
            {f}
          </text>
        ))}

        {/* Strings (thicker = lower) */}
        {Array.from({ length: stringCount }, (_, s) => (
          <rect
            key={s}
            x={MARGIN_X}
            y={stringY(s) - stringWeight(s) / 2}
            width={FRET_W * fretCount}
            height={stringWeight(s)}
            className="fb-string"
          />
        ))}

        {/* Capo */}
        {capo > 0 && (
          <g>
            <rect
              x={fretX(capo) - 9}
              y={MARGIN_Y - 16}
              width={18}
              height={STRING_GAP * (stringCount - 1) + 32}
              rx={9}
              className="fb-capo"
            />
            <text x={fretX(capo)} y={MARGIN_Y - 22} textAnchor="middle" className="fb-capo-label">
              capo
            </text>
          </g>
        )}

        {/* Pattern notes */}
        {pattern.map((note, i) => {
          const absFret = capo + note.fret
          // With a capo, "open" notes sound at the capo bar itself
          const cx = note.fret === 0 && capo > 0 ? fretX(capo) : fretX(note.fret === 0 ? 0 : absFret)
          const cy = stringY(note.string)
          const isCurrent = i === currentIndex
          const label =
            labelMode === 'degree'
              ? INTERVAL_LABELS[scale.intervals[note.degree]]
              : pitchClassName(midiPitchClass(note.midi))
          return (
            <g key={i} className={`fb-note${note.isRoot ? ' root' : ''}${isCurrent ? ' current' : ''}`}>
              <circle cx={cx} cy={cy} r={isCurrent ? 15 : 12} />
              <text x={cx} y={cy + 4} textAnchor="middle">
                {label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
