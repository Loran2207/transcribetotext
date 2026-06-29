import { useSearchParams } from "react-router";
import { PaymentError, PAYMENT_ERRORS } from "./payment-error";

/* ─────────────────────────────────────────────────────────────
   Isolated mobile "Complete Checkout" screen.
   Ported from Figma (node 2627:3) with the real brand-button and
   trust-badge images. Standalone route, only for design + capture.
   Modes (query params):
     ?err=<key>            show a payment-error block (above payment buttons)
     ?err=<key>&pos=bottom show it below the Continue button instead
     ?gallery=1            show the error block in all five copy variants
   ───────────────────────────────────────────────────────────── */

const ASSET = {
  paypal: "/checkout/paypal.png",
  link: "/checkout/link.png",
  gpay: "/checkout/gpay.png",
  badges: "/checkout/badges.png",
};

const ERROR_ORDER = ["payment_error", "card_declined", "insufficient_funds", "card_expired", "incorrect_details"];

function CloseButton() {
  return (
    <button
      type="button"
      aria-label="Close"
      className="absolute right-[16px] top-[16px] flex items-center justify-center size-[28px] rounded-full bg-primary/[0.08]"
    >
      <svg className="size-[14px] text-primary" fill="none" viewBox="0 0 16 16">
        <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={`text-[15px] ${bold ? "font-semibold text-foreground" : "font-normal text-foreground"}`}>{label}</span>
      <span className={`text-[15px] ${bold ? "font-semibold text-foreground" : "font-medium text-foreground"}`}>{value}</span>
    </div>
  );
}

function PaymentButtons() {
  return (
    <div className="flex flex-col gap-[12px]">
      <img src={ASSET.paypal} alt="Pay with PayPal" className="block w-full" draggable={false} />
      <img src={ASSET.link} alt="Pay with Link" className="block w-full" draggable={false} />
      <img src={ASSET.gpay} alt="Pay with Google Pay" className="block w-full" draggable={false} />
    </div>
  );
}

function CardFields() {
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

function ContinueButton() {
  return (
    <button type="button" className="w-full h-[48px] rounded-[10px] bg-primary text-primary-foreground font-semibold text-[15px]">
      Continue
    </button>
  );
}

function ErrorGallery() {
  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="w-full max-w-[390px] px-[20px] pt-[40px] pb-[44px] flex flex-col gap-[16px]">
        <div className="mb-[2px]">
          <p className="text-[18px] font-bold text-foreground tracking-[-0.2px]">Payment error states</p>
          <p className="text-[13px] text-muted-foreground mt-[3px]">One block, applied to different payment errors.</p>
        </div>
        {ERROR_ORDER.map((k, i) => (
          <PaymentError
            key={k}
            title={PAYMENT_ERRORS[k].title}
            message={PAYMENT_ERRORS[k].message}
            onRetry={i === 0 ? () => {} : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const [params] = useSearchParams();
  if (params.get("gallery")) return <ErrorGallery />;

  const errKey = params.get("err");
  const err = errKey && PAYMENT_ERRORS[errKey] ? PAYMENT_ERRORS[errKey] : null;
  const pos = params.get("pos") === "bottom" ? "bottom" : "top";
  const errorBlock = err ? <PaymentError title={err.title} message={err.message} onRetry={() => {}} /> : null;

  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="relative w-full max-w-[390px] bg-card flex flex-col px-[20px] pt-[52px] pb-[28px]">
        <CloseButton />

        <h1 className="text-center font-bold text-foreground text-[26px] leading-[31px] tracking-[-0.3px]">
          Complete Checkout
        </h1>

        {/* Order summary */}
        <div className="mt-[32px] flex flex-col gap-[8px]">
          <span className="text-[13px] text-muted-foreground">Order summary</span>
          <SummaryRow label="Regular 4-week price" value="$25.99" />
          <SummaryRow label="30+ Exclusive bonuses" value="Free" />
          <SummaryRow label="Total today:" value="$25.99" bold />
        </div>

        {/* Error - above all payment buttons (recommended placement) */}
        {pos === "top" && errorBlock && <div className="mt-[20px]">{errorBlock}</div>}

        {/* Payment options */}
        <div className="mt-[24px]">
          <PaymentButtons />
        </div>

        {/* Card form */}
        <div className="mt-[18px]">
          <CardFields />
        </div>

        {/* Primary CTA */}
        <div className="mt-[12px]">
          <ContinueButton />
        </div>

        {/* Error - alternate placement, below the Continue button */}
        {pos === "bottom" && errorBlock && <div className="mt-[14px]">{errorBlock}</div>}

        {/* Trust badges (no Stripe) */}
        <img src={ASSET.badges} alt="Guaranteed safe and secure checkout. Visa, Mastercard, American Express, Google Pay, Apple Pay, PayPal accepted." className="block w-full mt-[26px]" draggable={false} />

        {/* Legal */}
        <p className="mt-[14px] text-center text-[12px] leading-[18px] text-muted-foreground">
          By proceeding with the purchase, you agree to our{" "}
          <span className="text-primary font-medium">Terms of Service</span>,{" "}
          <span className="text-primary font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
