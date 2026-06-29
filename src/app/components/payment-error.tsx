import { motion, useReducedMotion } from "motion/react";
import { Alert02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";

export interface PaymentErrorInfo {
  title: string;
  message: string;
}

/* The five payment-error messages, nicer copy than a bare "insufficient funds". */
export const PAYMENT_ERRORS: Record<string, PaymentErrorInfo> = {
  payment_error:      { title: "Payment error",      message: "We couldn't process that payment, so try another payment method or card." },
  card_declined:      { title: "Card declined",      message: "Your bank declined this card, so please try a different one." },
  insufficient_funds: { title: "Insufficient funds", message: "This card doesn't have enough balance for today's total." },
  card_expired:       { title: "Card expired",       message: "This card's expiry date has passed, so add a current one." },
  incorrect_details:  { title: "Check details",      message: "The card number or security code looks incorrect, please recheck it." },
};

/* A calm, minimal payment-error chip: hairline destructive border, soft tinted
   wash, a thin red accent bar, a circular alert badge, a bold title + one calm
   sentence, and an optional "Try again" link. Red is rationed to small accents
   so it reads premium and reassuring, not alarming. */
export function PaymentError({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      role="alert"
      aria-live="polite"
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="relative w-full overflow-hidden rounded-[14px] border border-destructive/20 bg-destructive/[0.06]"
    >
      <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-destructive" />

      <div className="flex items-start gap-3 py-3.5 pl-[18px] pr-4">
        <motion.span
          initial={reduce ? false : { scale: 0.9 }}
          animate={reduce ? { scale: 1 } : { scale: [0.9, 1.06, 1] }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-px flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/15"
        >
          <Icon icon={Alert02Icon} className="size-[18px]" strokeWidth={2} />
        </motion.span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-5 text-foreground">{title}</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-muted-foreground">{message}</p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-destructive transition-opacity hover:opacity-80"
            >
              <Icon icon={RefreshIcon} className="size-[14px]" strokeWidth={2} />
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
