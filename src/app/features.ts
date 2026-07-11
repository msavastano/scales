import type { ComponentType } from 'react'
import { ScalePractice } from '../features/scale-practice/ScalePractice'
import { Tuner } from '../features/tuner/Tuner'

export interface Feature {
  id: string
  title: string
  /** Material Symbols icon name */
  icon: string
  component: ComponentType
}

/** Register new features here; the app shell picks them up automatically. */
export const FEATURES: Feature[] = [
  { id: 'scale-practice', title: 'Scale Practice', icon: 'music_note', component: ScalePractice },
  { id: 'tuner', title: 'Tuner', icon: 'graphic_eq', component: Tuner },
]
