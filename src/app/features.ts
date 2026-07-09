import type { ComponentType } from 'react'
import { ScalePractice } from '../features/scale-practice/ScalePractice'

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
]
