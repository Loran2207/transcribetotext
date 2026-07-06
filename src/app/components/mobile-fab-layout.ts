/* Shared geometry for the mobile floating action stack.

   The add "+" FAB lives in bottom-nav.tsx and the upload-history FAB lives in
   processing-mobile.tsx, but the two must levitate on the same right edge,
   stacked at the bottom-right corner. Both files import these constants so the
   stack stays aligned across components. */

export const FAB_RIGHT = 16; // px, shared right edge for both FABs
export const ADD_FAB_SIZE = 56; // px, primary "+" add button (bottom of the stack)
export const HISTORY_FAB_SIZE = 48; // px, upload-history button (above the add button)
export const FAB_STACK_GAP = 12; // px, vertical gap between the two FABs
// The history FAB is narrower than the add FAB; nudge its right edge so the two
// share a common CENTER line (not just a right edge) - reads as one aligned stack.
export const HISTORY_FAB_RIGHT = FAB_RIGHT + (ADD_FAB_SIZE - HISTORY_FAB_SIZE) / 2; // 20px

/* With no bottom nav pill, the add FAB simply floats near the bottom edge. */
const FAB_BOTTOM_MARGIN = 24; // px, add FAB distance from the bottom (before safe area)

const ADD_FAB_OFFSET = FAB_BOTTOM_MARGIN; // 24px
const HISTORY_FAB_OFFSET = ADD_FAB_OFFSET + ADD_FAB_SIZE + FAB_STACK_GAP; // 92px

export const ADD_FAB_BOTTOM = `calc(${ADD_FAB_OFFSET}px + env(safe-area-inset-bottom))`;
export const HISTORY_FAB_BOTTOM = `calc(${HISTORY_FAB_OFFSET}px + env(safe-area-inset-bottom))`;
