import type { LucideIcon } from 'lucide-react'
import { Sparkles, ChefHat, WashingMachine, Zap, BookOpen, Bike } from 'lucide-react'

export const CATEGORY_ICONS: Record<string, string> = {
  'maid': '🧹',
  'cook': '👨‍🍳',
  'electrician': '🔧',
  'dhobi': '👕',
  'tutor': '📚',
  'pickup-drop': '🚗',
  // Legacy slug fallbacks
  'maid-cleaning': '🧹',
  'cook-tiffin': '👨‍🍳',
  'electrician-plumber': '🔧',
  'dhobi-laundry': '👕',
  'tutoring': '📚',
}

/**
 * Maps category slug → Lucide icon component.
 * Used by CategoryCard and the home screen grid.
 */
export const CATEGORY_LUCIDE_ICONS: Record<string, LucideIcon> = {
  'maid': Sparkles,
  'cook': ChefHat,
  'dhobi': WashingMachine,
  'electrician': Zap,
  'tutor': BookOpen,
  'pickup-drop': Bike,
  // Legacy slug fallbacks
  'maid-cleaning': Sparkles,
  'cook-tiffin': ChefHat,
  'dhobi-laundry': WashingMachine,
  'electrician-plumber': Zap,
  'tutoring': BookOpen,
}

/**
 * Maps category slug → Tailwind color classes for icon container + text.
 * Colours correspond to M3 design tokens defined in globals.css.
 */
export const CATEGORY_COLOR_CLASSES: Record<string, string> = {
  'maid': 'bg-primary-fixed text-primary',
  'cook': 'bg-secondary-fixed text-secondary',
  'dhobi': 'bg-tertiary-fixed text-tertiary',
  'electrician': 'bg-error-container text-error',
  'tutor': 'bg-[#cde5ff] text-[#073452]',
  'pickup-drop': 'bg-primary-fixed-dim text-on-primary-container',
  // Legacy slug fallbacks
  'maid-cleaning': 'bg-primary-fixed text-primary',
  'cook-tiffin': 'bg-secondary-fixed text-secondary',
  'dhobi-laundry': 'bg-tertiary-fixed text-tertiary',
  'electrician-plumber': 'bg-error-container text-error',
  'tutoring': 'bg-[#cde5ff] text-[#073452]',
}
