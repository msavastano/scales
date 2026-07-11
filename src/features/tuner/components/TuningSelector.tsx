import { TUNINGS } from '../../../lib/music/tuning'

interface TuningSelectorProps {
  tuningId: string
  onChange: (id: string) => void
}

/** Tuning select for the hero panel; mirrors the scale-practice HeroSelect styling. */
export function TuningSelector({ tuningId, onChange }: TuningSelectorProps) {
  return (
    <div className="flex flex-col w-full sm:w-auto sm:min-w-[220px]">
      <label className="font-mono text-label-sm uppercase text-outline mb-1">Tuning</label>
      <div className="relative">
        <select
          value={tuningId}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none w-full bg-surface-container text-on-surface font-mono text-label-sm rounded-t-lg border-0 border-b-2 border-outline focus:border-primary outline-none px-4 py-2.5 pr-9 cursor-pointer transition-colors"
        >
          {TUNINGS.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-outline-variant">
          expand_more
        </span>
      </div>
    </div>
  )
}
