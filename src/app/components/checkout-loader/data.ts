/**
 * Catalog for the checkout-loader handoff board.
 *
 * The new payment provider swaps the card-input fields for a loader while the
 * charge is processed — no button, just the animation and a status line. Two
 * status messages mirror the current button copy; two animation candidates are
 * under review. Nothing here is wired into the live app.
 */

export type CheckoutStatusId = "processing" | "preparing";

export interface CheckoutStatus {
  id: CheckoutStatusId;
  label: string;
}

export const CHECKOUT_STATUSES: CheckoutStatus[] = [
  { id: "processing", label: "Processing…" },
  { id: "preparing", label: "Preparing Subscription…" },
];

export interface LottieCandidate {
  id: string;
  /** Public path to the Lottie JSON. */
  src: string;
  /** Render width / height in px — keeps each animation's native aspect ratio. */
  w: number;
  h: number;
  /** Status-text color. Defaults to the accent green; some variants go black for variety. */
  textColor?: string;
}

export const LOTTIE_CANDIDATES: LottieCandidate[] = [
  { id: "money-transfer", src: "/lottie/money-transfer.json", w: 156, h: 156 },
  { id: "insider-loading", src: "/lottie/insider-loading.json", w: 188, h: 94 },
  { id: "timing", src: "/lottie/timing-green.json", w: 150, h: 150, textColor: "#18181B" },
];

/** Single accent green — same value the provider's pay button uses. */
export const CHECKOUT_GREEN = "#1FAD5E";

/** Fixed height of the animation slot so status labels line up across cards. */
export const STAGE_H = 160;
