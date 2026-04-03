import type { LucideIcon } from 'lucide-react'
import { Sparkles, ChefHat, WashingMachine, Zap, BookOpen, Bike } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, string> = {
  'maid-cleaning': '🧹',
  'cook-tiffin': '👨‍🍳',
  'electrician-plumber': '🔧',
  'dhobi-laundry': '👕',
  'tutoring': '📚',
  'pickup-drop': '🚗',
}

/**
 * Maps category slug → Lucide icon component.
 * Used by CategoryCard and the home screen grid.
 */
export const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  'maid-cleaning': Sparkles,
  'cook-tiffin': ChefHat,
  'dhobi-laundry': WashingMachine,
  'electrician-plumber': Zap,
  'tutoring': BookOpen,
  'pickup-drop': Bike,
}

/**
 * Maps category slug → Tailwind color classes for icon container + text.
 * Colours correspond to M3 design tokens defined in globals.css.
 */
export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  'maid-cleaning': 'bg-primary-fixed text-primary',
  'cook-tiffin': 'bg-secondary-fixed text-secondary',
  'dhobi-laundry': 'bg-tertiary-fixed text-tertiary',
  'electrician-plumber': 'bg-error-container text-error',
  'tutoring': 'bg-[#cde5ff] text-[#073452]',
  'pickup-drop': 'bg-primary-fixed-dim text-on-primary-container',
}
