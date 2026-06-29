import { motion, useReducedMotion } from "motion/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";
import { Icon } from "./ui/icon";

export interface PaymentErrorInfo {
  title: string;
  message: string;
  /** Action label, present only when an action genuinely helps (focuses the card field). */
  action?: string;
}

export type PaymentErrorVariant = "1" | "2" | "3" | "4";

/* Terse, Stripe-style copy: the title is the error, the message is one short
   clarifying line, and an action exists only where it actually helps. */
export const PAYMENT_ERRORS: Record<string, PaymentErrorInfo> = {
  payment_error:      { title: "Payment error",      message: "We couldn't process this payment.",        action: "Try another card" },
  card_declined:      { title: "Card declined",      message: "Your bank declined this card.",             action: "Try another card" },
  insufficient_funds: { title: "Insufficient funds", message: "This card has insufficient funds.",         action: "Try another card" },
  card_expired:       { title: "Card expired",       message: "This card has expired.",                    action: "Try another card" },
  incorrect_details:  { title: "Check your details", message: "The card number or code looks incorrect." },
};

export const VARIANT_LABELS: Record<PaymentErrorVariant, string> = {
  "1": "Solid banner",
  "2": "Soft left accent",
  "3": "Leading panel",
  "4": "Refined minimal",
};

export const VARIANT_ORDER: PaymentErrorVariant[] = ["1", "2", "3", "4"];

type BlockProps = { title: string; message: string; action?: string; onAction?: () => void };

/* Variant 1 - Solid full-bleed banner: a compact two-line red bar that spans the
   screen edge to edge. The consumer removes side padding so it bleeds. */
function VariantBanner({ title, message }: BlockProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      role="alert"
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full items-center gap-3 bg-destructive px-5 py-[14px]"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/25">
        <Icon icon={AlertCircleIcon} className="size-[17px] text-white" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold leading-tight text-white">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-[1.35] text-white/85">{message}</p>
      </div>
    </motion.div>
  );
}

/* Variant 2 - Soft left-accent notice: light wash, thick red left bar,
   circular alert icon + title + body. A calm, premium notice, no action. */
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
      <div className="flex items-start gap-3 py-[16px] pl-5 pr-4">
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
   a white alert glyph. The action (when present) is a plain text control - no
   arrow, since it focuses the card field rather than navigating away. */
function VariantPanel({ title, message, action, onAction }: BlockProps) {
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
        {action && (
          <button type="button" onClick={onAction} className="mt-1.5 w-fit text-[13px] font-medium text-destructive underline decoration-destructive/30 underline-offset-[3px] transition-colors hover:decoration-destructive">
            {action}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* Variant 4 - Refined minimal: near-borderless white, a single alert glyph, a
   bold title and muted body, and a quiet text action (no arrow, no status dot). */
function VariantRefined({ title, message, action, onAction }: BlockProps) {
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
          <p className="text-[14px] font-semibold leading-5 tracking-[-0.01em] text-foreground">{title}</p>
          <p className="mt-1 text-[13px] leading-5 text-muted-foreground">{message}</p>
          {action && (
            <button type="button" onClick={onAction} className="mt-2.5 text-[13px] font-medium text-destructive underline decoration-destructive/30 underline-offset-[3px] transition-colors hover:decoration-destructive">
              {action}
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
  action,
  onAction,
}: BlockProps & { variant?: PaymentErrorVariant }) {
  const props = { title, message, action, onAction };
  if (variant === "2") return <VariantNotice {...props} />;
  if (variant === "3") return <VariantPanel {...props} />;
  if (variant === "4") return <VariantRefined {...props} />;
  return <VariantBanner {...props} />;
}
