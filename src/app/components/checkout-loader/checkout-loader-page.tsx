import { CheckoutLoading } from "./checkout-card";
import { CHECKOUT_STATUSES, LOTTIE_CANDIDATES } from "./data";

/**
 * `/checkout-loader` — a handoff board (no app chrome, reachable by URL only).
 *
 * One box, four cards: each animation candidate across both status messages.
 * That's the whole set the new payment provider shows where the card fields used
 * to be. Nothing here is wired into the live app.
 */
export function CheckoutLoaderPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#F4F5F7] px-6 py-16 font-sans text-zinc-900">
      <div
        id="checkout-board"
        className="grid w-full max-w-[760px] grid-cols-1 gap-6 rounded-[28px] bg-[#F1F3F5] p-6 ring-1 ring-zinc-200/80 sm:grid-cols-2 sm:p-8"
      >
        {LOTTIE_CANDIDATES.flatMap((lottie) =>
          CHECKOUT_STATUSES.map((status) => (
            <CheckoutLoading key={`${lottie.id}-${status.id}`} status={status} lottie={lottie} />
          )),
        )}
      </div>
    </div>
  );
}
