/* Shared geometry for the mobile floating action stack.

   The add "+" FAB lives in bottom-nav.tsx and the upload-history FAB lives in
   processing-mobile.tsx, but the two must levitate on the same right edge,
   stacked above the floating nav pill. Both files import these constants so the
   stack stays aligned across components. If the nav pill height/offset in
   bottom-nav.tsx ever changes, update NAV_PILL_* here to match. */

export const FAB_RIGHT = 16; // px, shared right edge for both FABs
export const ADD_FAB_SIZE = 56; // px, primary "+" add button (bottom of the stack)
export const HISTORY_FAB_SIZE = 48; // px, upload-history button (above the add button)
export const FAB_STACK_GAP = 12; // px, vertical gap between the two FABs

/* Nav pill footprint - mirrors the values used in bottom-nav.tsx. */
const NAV_PILL_BOTTOM = 14; // px, nav pill distance from the bottom (before safe area)
const NAV_PILL_HEIGHT = 58; // px, nav pill height
const NAV_GAP = 12; // px, gap between the nav pill and the add FAB

const ADD_FAB_OFFSET = NAV_PILL_BOTTOM + NAV_PILL_HEIGHT + NAV_GAP; // 84px
const HISTORY_FAB_OFFSET = ADD_FAB_OFFSET + ADD_FAB_SIZE + FAB_STACK_GAP; // 152px

export const ADD_FAB_BOTTOM = `calc(${ADD_FAB_OFFSET}px + env(safe-area-inset-bottom))`;
export const HISTORY_FAB_BOTTOM = `calc(${HISTORY_FAB_OFFSET}px + env(safe-area-inset-bottom))`;
