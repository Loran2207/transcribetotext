/* The fresh account: what a person sees the first time they sign in.

   On this branch it is the default, so the onboarding can be judged the way
   a new user meets it: no folders, no meetings, and exactly one recording,
   the welcome one, which every lesson points at. The full demo world comes
   back with `localStorage.ttt_demo_fresh = "0"`. */

export const WELCOME_RECORD_ID = "welcome";

export function isFreshAccount(): boolean {
  if (typeof window === "undefined") return false;
  try { return window.localStorage.getItem("ttt_demo_fresh") !== "0"; } catch { return true; }
}
