import { LottieStage } from "./lottie-stage";
import { CHECKOUT_GREEN, STAGE_H, type CheckoutStatus, type LottieCandidate } from "./data";

/**
 * One loading state: a white card with the animation centered over a fixed-height
 * slot and the status line below it. No top bar, no button - during the real
 * charge the provider shows only this loader where the card fields used to be.
 */
export function CheckoutLoading({ status, lottie }: { status: CheckoutStatus; lottie: LottieCandidate }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 rounded-2xl bg-white px-8 py-10 shadow-[0_10px_36px_-14px_rgba(16,24,40,0.16)] ring-1 ring-black/[0.05]">
      <div style={{ height: STAGE_H }} className="flex items-center justify-center">
        <LottieStage src={lottie.src} w={lottie.w} h={lottie.h} />
      </div>
      <span className="text-[15px] font-semibold" style={{ color: lottie.textColor ?? CHECKOUT_GREEN }}>
        {status.label}
      </span>
    </div>
  );
}
