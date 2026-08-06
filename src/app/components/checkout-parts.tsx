import type { ReactNode } from "react";

/* The pieces both checkout screens share. The plain checkout and the 75% promo
   variation draw the same summary rows, brand buttons, card fields and trust
   strip; only the surface around them changes with the width. */

export const CHECKOUT_ASSET = {
  paypal: "/checkout/paypal.png",
  link: "/checkout/link.png",
  gpay: "/checkout/gpay.png",
  badges: "/checkout/badges.png",
};

export function CheckoutCloseButton() {
  return (
    <button type="button" aria-label="Close" className="absolute right-[16px] top-[16px] flex items-center justify-center size-[28px] rounded-full bg-primary/[0.08]">
      <svg className="size-[14px] text-primary" fill="none" viewBox="0 0 16 16">
        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/* The value is a node, not a string: the promo row shows the old price struck
   through next to the new one, and everywhere else it is still just text. */
export function SummaryRow({ label, value, bold }: { label: string; value: ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={"text-[15px] " + (bold ? "font-semibold text-foreground" : "font-normal text-foreground")}>{label}</span>
      <span className={"shrink-0 text-[15px] " + (bold ? "font-semibold text-foreground" : "font-medium text-foreground")}>{value}</span>
    </div>
  );
}

export function PaymentButtons() {
  return (
    <div className="flex flex-col gap-[12px]">
      <img src={CHECKOUT_ASSET.paypal} alt="Pay with PayPal" className="block w-full" draggable={false} />
      <img src={CHECKOUT_ASSET.link} alt="Pay with Link" className="block w-full" draggable={false} />
      <img src={CHECKOUT_ASSET.gpay} alt="Pay with Google Pay" className="block w-full" draggable={false} />
    </div>
  );
}

export function CardFields() {
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center h-[48px] px-[14px] rounded-[10px] border border-border bg-background">
        <span className="text-[14px] text-muted-foreground">Credit or Debit card number</span>
      </div>
      <div className="flex gap-[10px]">
        <div className="flex items-center flex-1 h-[48px] px-[12px] rounded-[10px] border border-border bg-background">
          <span className="text-[13.5px] text-muted-foreground whitespace-nowrap">Expiry date MM/YY</span>
        </div>
        <div className="flex items-center flex-1 h-[48px] px-[12px] rounded-[10px] border border-border bg-background">
          <span className="flex-1 text-[13.5px] text-muted-foreground">CVV/CVC</span>
          <svg className="size-[18px] text-muted-foreground/70 shrink-0" fill="none" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 9v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="10" cy="6.6" r="0.9" fill="currentColor" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export function TrustBadges({ className = "" }: { className?: string }) {
  return (
    <img
      src={CHECKOUT_ASSET.badges}
      alt="Guaranteed safe and secure checkout. Visa, Mastercard, American Express, Google Pay, Apple Pay, PayPal accepted."
      className={"block w-full " + className}
      draggable={false}
    />
  );
}
