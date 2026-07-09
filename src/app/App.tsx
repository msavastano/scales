import { useState } from 'react'
import { FEATURES } from './features'

export function App() {
  const [activeId, setActiveId] = useState(FEATURES[0].id)
  const active = FEATURES.find((f) => f.id === activeId) ?? FEATURES[0]
  const ActiveComponent = active.component

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Scales</h1>
        <nav>
          {FEATURES.map((f) => (
            <button
              key={f.id}
              className={`nav-btn${f.id === active.id ? ' active' : ''}`}
              onClick={() => setActiveId(f.id)}
            >
              {f.title}
            </button>
          ))}
        </nav>
      </header>
      <main>
        <ActiveComponent />
      </main>
    </div>
  )
}
