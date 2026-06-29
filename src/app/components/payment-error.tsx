import { motion, useReducedMotion } from "motion/react";
import { AlertCircleIcon, CreditCardIcon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";

export interface PaymentErrorInfo {
  title: string;
  message: string;
}

export type PaymentErrorVariant = "1" | "2" | "3" | "4";

/* Payment-error messages, nicer copy than a bare "insufficient funds". */
export const PAYMENT_ERRORS: Record<string, PaymentErrorInfo> = {
  payment_error:      { title: "Payment error",      message: "We couldn't process that payment, so try another payment method or card." },
  card_declined:      { title: "Card declined",      message: "Your bank declined this card, so please try a different one." },
  insufficient_funds: { title: "Insufficient funds", message: "This card doesn't have enough balance for today's total." },
  card_expired:       { title: "Card expired",       message: "This card's expiry date has passed, so add a current one." },
  incorrect_details:  { title: "Check details",      message: "The card number or security code looks incorrect, please recheck it." },
};

export const VARIANT_LABELS: Record<PaymentErrorVariant, string> = {
  "1": "Solid banner",
  "2": "Soft left accent",
  "3": "Leading panel",
  "4": "Refined minimal",
};

export const VARIANT_ORDER: PaymentErrorVariant[] = ["1", "2", "3", "4"];

type BlockProps = { title: string; message: string; onRetry?: () => void };

/* Variant 1 - Solid red banner: bold solid-red surface, white icon chip + title,
   message under, full-width white "Try another card" pill. The hero. */
function VariantBanner({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="w-full rounded-[14px] bg-destructive p-[18px] ring-1 ring-destructive/20"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15 ring-1 ring-inset ring-white/25">
          <Icon icon={AlertCircleIcon} className="size-[18px] text-white" strokeWidth={2} />
        </span>
        <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-tight tracking-[-0.01em] text-white">{title}</h3>
      </div>
      <p className="mt-2 pl-12 text-[13px] leading-[1.45] text-white/85">{message}</p>
      {onRetry && (
        <motion.button
          type="button"
          onClick={onRetry}
          whileTap={reduce ? undefined : { scale: 0.975 }}
          className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white text-[13px] font-semibold text-destructive transition-colors hover:bg-white/95 active:bg-white/90"
        >
          <Icon icon={CreditCardIcon} className="size-[16px]" strokeWidth={2} />
          Try another card
        </motion.button>
      )}
    </motion.div>
  );
}

/* Variant 2 - Soft red left-accent notice: light wash, thick red left bar,
   circular alert icon + title + body. Pure guidance, no action. */
function VariantNotice({ title, message }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 6, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="relative w-full overflow-hidden rounded-[14px] border border-destructive/15 bg-destructive/[0.06]"
    >
      <span aria-hidden className="absolute inset-y-0 left-0 w-[4px] bg-destructive" />
      <div className="flex items-start gap-3 py-[18px] pl-5 pr-4">
        <span aria-hidden className="mt-px shrink-0 text-destructive">
          <Icon icon={AlertCircleIcon} className="size-[18px]" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-5 tracking-[-0.01em] text-foreground">{title}</h3>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{message}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* Variant 3 - Leading red panel: white card with a solid red left panel holding
   a white alert glyph; right side has title + body + a "Try another card" link. */
function VariantPanel({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="flex w-full items-stretch overflow-hidden rounded-[16px] border border-border bg-card"
    >
      <div className="flex w-[52px] shrink-0 items-center justify-center bg-destructive">
        <div className="grid size-9 place-items-center rounded-full bg-white/15">
          <Icon icon={AlertCircleIcon} className="size-[20px] text-white" strokeWidth={2} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 px-4 py-3.5">
        <p className="text-[15px] font-semibold leading-tight tracking-[-0.01em] text-foreground">{title}</p>
        <p className="text-[13px] leading-[1.45] text-muted-foreground">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="group mt-1.5 inline-flex w-fit items-center gap-1 text-[13px] font-medium text-destructive transition-colors hover:text-destructive/80"
          >
            Try another card
            <Icon icon={ArrowRight01Icon} className="size-[14px] transition-transform duration-200 group-hover:translate-x-0.5" strokeWidth={2} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* Variant 4 - Refined minimal: near-borderless white, leading alert icon, title
   with a tiny haloed status dot, body, and a quiet "Try another card" link. */
function VariantRefined({ title, message, onRetry }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      style={{ boxShadow: "var(--elevation-sm)" }}
      className="w-full rounded-[14px] border border-destructive/15 bg-white px-4 py-4"
    >
      <div className="flex gap-3">
        <Icon icon={AlertCircleIcon} strokeWidth={2} className="mt-px size-[18px] shrink-0 text-destructive" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center">
            <p className="text-[14px] font-semibold leading-5 tracking-[-0.01em] text-foreground">{title}</p>
            <span className="ml-auto size-[6px] shrink-0 rounded-full bg-destructive ring-4 ring-destructive/10" />
          </div>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{message}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="group -mx-1 mt-3 inline-flex items-center gap-1 rounded-[8px] px-1 py-1 text-[13px] font-medium text-destructive transition-colors hover:text-destructive/75"
            >
              Try another card
              <Icon icon={ArrowRight01Icon} strokeWidth={2} className="size-[15px] transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          )}
        </div>
      </div>
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
  if (variant === "2") return <VariantNotice {...props} />;
  if (variant === "3") return <VariantPanel {...props} />;
  if (variant === "4") return <VariantRefined {...props} />;
  return <VariantBanner {...props} />;
}
