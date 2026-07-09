import { useState } from 'react'
import { FEATURES } from './features'

export function App() {
  const [activeId, setActiveId] = useState(FEATURES[0].id)
  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0]
  const ActiveComponent = active.component

  return (
    <div className="min-h-screen flex bg-background text-on-surface font-body">
      {/* Side nav rail — expands on hover */}
      <nav className="hidden lg:flex flex-col items-center shrink-0 w-16 py-8 h-screen sticky top-0 z-20 overflow-hidden bg-surface-container border-r border-outline-variant transition-all duration-300 hover:w-64 group">
        <div className="flex items-center w-full mb-8">
          <span className="w-16 shrink-0 flex justify-center material-symbols-outlined filled text-secondary text-3xl">
            music_note
          </span>
          <span className="whitespace-nowrap font-display text-headline-md font-bold opacity-0 group-hover:opacity-100 transition-opacity">
            Scales
          </span>
        </div>
        <div className="flex-1 w-full px-2 space-y-2">
          {FEATURES.map((f) => {
            const isActive = f.id === active.id
            return (
              <button
                key={f.id}
                onClick={() => setActiveId(f.id)}
                className={`flex items-center p-3 rounded-lg w-full cursor-pointer transition-colors ${
                  isActive
                    ? 'text-primary bg-primary-container/10'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span
                  className={`material-symbols-outlined w-8 flex justify-center${isActive ? ' filled' : ''}`}
                >
                  {f.icon}
                </span>
                <span className="font-mono text-label-sm ml-3 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {f.title}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-12 py-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center lg:hidden">
            <span className="material-symbols-outlined filled text-secondary text-2xl mr-2">music_note</span>
            <span className="font-display text-headline-md font-bold">Scales</span>
          </div>
          <div className="hidden lg:block font-mono text-label-sm uppercase text-on-surface-variant">
            {active.title}
          </div>
          {FEATURES.length > 1 && (
            <nav className="flex items-center gap-2 lg:hidden">
              {FEATURES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setActiveId(f.id)}
                  className={`font-mono text-label-sm px-3 py-2 rounded-lg transition-colors ${
                    f.id === active.id
                      ? 'text-primary bg-primary-container/10'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {f.title}
                </button>
              ))}
            </nav>
          )}
        </header>
        <main className="flex-1 p-4 md:p-12 pb-64 md:pb-40">
          <div className="max-w-7xl mx-auto">
            <ActiveComponent />
          </div>
        </main>
      </div>
    </div>
  )
}
