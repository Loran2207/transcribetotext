// Demo billing dates for the plan screens. Derived from today, so the preview
// never shows a renewal or an access window that has already passed, and every
// screen in the plan flow prints the date the same way.

const DAY_MS = 24 * 60 * 60 * 1000;

export function billingDay(offsetDays: number): string {
  return new Date(Date.now() + offsetDays * DAY_MS).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// End of the current paid period, and where a one-month pause lands after it.
export const ACTIVE_UNTIL = billingDay(29);
export const PAUSED_UNTIL = billingDay(59);
