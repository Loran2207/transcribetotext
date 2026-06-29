import { motion, useReducedMotion } from "motion/react";
import { Alert02Icon, AlertCircleIcon, RefreshIcon, CreditCardIcon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";

export interface PaymentErrorInfo {
  title: string;
  message: string;
}

export type PaymentErrorVariant = "1" | "2" | "3" | "4";

/* The payment-error messages, nicer copy than a bare "insufficient funds". */
export const PAYMENT_ERRORS: Record<string, PaymentErrorInfo> = {
  payment_error:      { title: "Payment error",      message: "We couldn't process that payment, so try another payment method or card." },
  card_declined:      { title: "Card declined",      message: "Your bank declined this card, so please try a different one." },
  insufficient_funds: { title: "Insufficient funds", message: "This card doesn't have enough balance for today's total." },
  card_expired:       { title: "Card expired",       message: "This card's expiry date has passed, so add a current one." },
  incorrect_details:  { title: "Check details",      message: "The card number or security code looks incorrect, please recheck it." },
};

export const VARIANT_LABELS: Record<PaymentErrorVariant, string> = {
  "1": "Calm chip",
  "2": "Minimal outline",
  "3": "Action card",
  "4": "Bold expressive",
};

type BlockProps = { title: string; message: string; onRetry?: () => void };

/* Variant 1 - Calm tinted chip: soft wash, 3px accent bar, circular badge,
   quiet inline "Try again" link. The premium, low-key baseline. */
function VariantChip({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="relative w-full overflow-hidden rounded-[14px] border border-destructive/20 bg-destructive/[0.06] py-3 pl-4 pr-3.5 ring-1 ring-destructive/[0.06]"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-destructive" />
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 ring-1 ring-destructive/15">
          <Icon icon={Alert02Icon} className="size-[18px] text-destructive" strokeWidth={2} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="text-[14px] font-semibold leading-tight text-foreground">{title}</p>
          <p className="text-[13px] leading-snug text-muted-foreground">{message}</p>
          {onRetry && (
            <button type="button" onClick={onRetry} className="mt-2 inline-flex items-center gap-1 self-start text-[13px] font-medium text-destructive transition-opacity hover:opacity-80">
              <Icon icon={RefreshIcon} className="size-[14px]" strokeWidth={2} />
              Try again
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* Variant 2 - Minimal outline: hairline border, near-zero tint, inline icon +
   title, message hanging-indented under the title. Airy, no action. */
function VariantMinimal({ title, message }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="w-full rounded-[14px] border border-destructive/25 bg-destructive/[0.03] px-4 py-3.5"
    >
      <div className="flex items-center gap-2">
        <Icon icon={AlertCircleIcon} className="size-[18px] shrink-0 text-destructive" strokeWidth={2} />
        <p className="text-[15px] font-semibold leading-none tracking-[-0.01em] text-foreground">{title}</p>
      </div>
      <p className="mt-1.5 pl-[26px] text-[13px] leading-[1.45] text-muted-foreground">{message}</p>
    </motion.div>
  );
}

/* Variant 3 - Action card: square red icon tile + a full-width outline pill
   "Try another card" CTA. Structured and action-led. */
function VariantActionCard({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="w-full rounded-[14px] border border-destructive/20 bg-card p-3.5"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-destructive/10 ring-1 ring-inset ring-destructive/15">
          <Icon icon={Alert02Icon} className="size-[18px] text-destructive" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[14px] font-semibold leading-5 text-foreground">{title}</p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full border border-destructive/30 bg-destructive/5 px-4 text-[13px] font-semibold text-destructive transition-colors hover:bg-destructive/10">
          <Icon icon={CreditCardIcon} className="size-[16px]" strokeWidth={2} />
          Try another card
        </button>
      )}
    </motion.div>
  );
}

/* Variant 4 - Bold expressive: solid red badge (white icon) with a ring halo,
   richer tint, bold title, compact solid-red "Try again" pill. Confident. */
function VariantBold({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  const container = {
    hidden: { opacity: 0, y: reduce ? 0 : 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1], when: "beforeChildren", staggerChildren: 0.06 } },
  };
  const badge = {
    hidden: { opacity: 0, scale: reduce ? 1 : 0.7 },
    show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 520, damping: 24 } },
  };
  const item = {
    hidden: { opacity: 0, y: reduce ? 0 : 4 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: "easeOut" } },
  };
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      role="alert"
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="w-full rounded-[16px] border border-destructive/25 bg-destructive/[0.10] p-4"
    >
      <div className="flex items-start gap-3.5">
        <motion.div variants={badge} className="flex size-11 shrink-0 items-center justify-center rounded-full bg-destructive text-white ring-4 ring-destructive/20">
          <Icon icon={Alert02Icon} className="size-[22px]" strokeWidth={2.5} />
        </motion.div>
        <div className="min-w-0 flex-1 pt-0.5">
          <motion.p variants={item} className="text-[15px] font-bold leading-tight tracking-[-0.01em] text-foreground">{title}</motion.p>
          <motion.p variants={item} className="mt-1 text-[13px] leading-[1.35] text-muted-foreground">{message}</motion.p>
        </div>
      </div>
      {onRetry && (
        <motion.div variants={item} className="mt-3 flex justify-end">
          <button type="button" onClick={onRetry} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-destructive px-3.5 text-[13px] font-semibold text-white transition-transform hover:bg-destructive/90 active:scale-[0.97]">
            <Icon icon={RefreshIcon} className="size-[14px]" strokeWidth={2.5} />
            Try again
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

/* Dispatcher: pick a design variant. */
export function PaymentError({
  variant = "1",
  title,
  message,
  onRetry,
}: BlockProps & { variant?: PaymentErrorVariant }) {
  const props = { title, message, onRetry };
  if (variant === "2") return <VariantMinimal {...props} />;
  if (variant === "3") return <VariantActionCard {...props} />;
  if (variant === "4") return <VariantBold {...props} />;
  return <VariantChip {...props} />;
}
