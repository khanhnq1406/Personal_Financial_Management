/**
 * Centralized Z-Index Scale
 *
 * This file defines the z-index hierarchy for the application.
 * All z-index values should reference these constants to ensure
 * consistent layer ordering across components.
 *
 * Z-Index Hierarchy:
 * 0-9:    Base and content layers
 * 10-19:  Sticky/fixed content
 * 20-29:  Dropdowns and popovers
 * 30-39:  Sidebars and navigation
 * 40-49:  Floating elements (FABs, helpers)
 * 50-59:  Modals and overlays
 * 60-69:  Toast notifications
 * 70-79:  Global search
 * 80-89:  Tooltips and tours
 * 90-99:  Special cases
 * 100:    Maximum (critical overlays)
 *
 * Usage:
 *   import { ZIndex } from '@/lib/utils/z-index';
 *
 *   // In JSX:
 *   className="z-modal"
 *   <div style={{ zIndex: ZIndex.modal }} />
 *
 *   // For modal stacking:
 *   const getStackedZIndex = (depth: number) =>
 *     Math.min(ZIndex.modal + depth, ZIndex['modal-stack-5']);
 */

export const ZIndex = {
  /** Base layer (0) */
  base: 0,

  /** Content layer (1) */
  content: 1,

  /** Sticky/fixed content (10) */
  sticky: 10,

  /** Dropdown menus and popovers (20) */
  dropdown: 20,

  /** Fixed sidebars and navigation (30) */
  sidebar: 30,

  /** Floating action buttons and helpers (40) */
  floating: 40,

  /** Modal overlay backdrop (45) - always below modals */
  modalBackdrop: 45,

  /** Modal base (50) - standard modal z-index */
  modal: 50,

  /** Modal raised (51) - for stacked modals */
  modalRaised: 51,

  /** Modal stack level 2 (52) */
  modalStack2: 52,

  /** Modal stack level 3 (53) */
  modalStack3: 53,

  /** Modal stack level 4 (54) */
  modalStack4: 54,

  /** Modal stack level 5 (55) - maximum recommended modal stack */
  modalStack5: 55,

  /** Toast notifications (60) */
  toast: 60,

  /** Global search (70) */
  globalSearch: 70,

  /** Tooltips (80) */
  tooltip: 80,

  /** Feature tour (85) */
  tour: 85,

  /** Always on top (90) - reserved for special cases */
  alwaysTop: 90,

  /** Maximum z-index (100) - for critical overlays */
  max: 100,
} as const;

/**
 * Get a stacked modal z-index value
 * @param depth The stack depth (1-5, where 1 is the base modal)
 * @returns The z-index value for the stacked modal
 */
export function getModalStackZIndex(depth: number = 1): number {
  const stackZIndex = ZIndex.modal + depth;
  return Math.min(stackZIndex, ZIndex.modalStack5);
}

/**
 * Get the backdrop z-index for a modal at a given stack depth
 * @param depth The stack depth (1-5)
 * @returns The z-index value for the backdrop (always 1 below modal)
 */
export function getModalBackdropZIndex(depth: number = 1): number {
  return getModalStackZIndex(depth) - 1;
}

/**
 * Type for z-index keys
 */
export type ZIndexKey = keyof typeof ZIndex;
