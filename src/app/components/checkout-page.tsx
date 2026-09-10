import { useSearchParams } from "react-router";
import { PaymentError, PAYMENT_ERRORS, VARIANT_ORDER, type PaymentErrorVariant } from "./payment-error";
import { CardFields, CheckoutCloseButton, PaymentButtons, SummaryRow, TrustBadges } from "./checkout-parts";
import { Button } from "./ui/button";

/* ─────────────────────────────────────────────────────────────
   Isolated mobile "Complete Checkout" screen (Figma node 2627:3)
   with the real brand-button + no-Stripe trust-badge images.
   Standalone route, design + capture only. The 75% win-back
   variation of this screen lives at /checkout-75.
   Query modes:
     ?err=<key>&v=<1..4>   error block above the payment buttons, design variant v
     ?msgs=<1..4>          one design variant shown across every error message
   ───────────────────────────────────────────────────────────── */

const MSG_ORDER = ["payment_error", "card_declined", "insufficient_funds", "card_expired", "incorrect_details"];

/* One design variant shown across every error message. */
function MessageGallery({ variant }: { variant: PaymentErrorVariant }) {
  const fullBleed = variant === "1";
  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className={`w-full max-w-[390px] pt-[28px] pb-[40px] flex flex-col ${fullBleed ? "gap-[10px]" : "px-[20px] gap-[14px]"}`}>
        {MSG_ORDER.map((k) => (
          <PaymentError
            key={k}
            variant={variant}
            title={PAYMENT_ERRORS[k].title}
            message={PAYMENT_ERRORS[k].message}
            action={PAYMENT_ERRORS[k].action}
            onAction={() => {}}
          />
        ))}
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const [params] = useSearchParams();

  const msgs = params.get("msgs");
  if (msgs && VARIANT_ORDER.includes(msgs as PaymentErrorVariant)) {
    return <MessageGallery variant={msgs as PaymentErrorVariant} />;
  }

  const errKey = params.get("err");
  const err = errKey && PAYMENT_ERRORS[errKey] ? PAYMENT_ERRORS[errKey] : null;
  const vParam = params.get("v");
  const variant: PaymentErrorVariant = (VARIANT_ORDER.includes(vParam as PaymentErrorVariant) ? vParam : "1") as PaymentErrorVariant;

  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="relative w-full max-w-[390px] bg-card flex flex-col px-[20px] pt-[52px] pb-[28px]">
        <CheckoutCloseButton />

        <h1 className="text-center font-bold text-foreground text-[26px] leading-[31px] tracking-[-0.3px]">
          Complete Checkout
        </h1>

        <div className="mt-[32px] flex flex-col gap-[8px]">
          <span className="text-[13px] text-muted-foreground">Order summary</span>
          <SummaryRow label="Regular 4-week price" value="$25.99" />
          <SummaryRow label="30+ Exclusive bonuses" value="Free" />
          <SummaryRow label="Total today:" value="$25.99" bold />
        </div>

        {/* Error - above all payment buttons. Variant 1 bleeds edge to edge. */}
        {err && (
          <div className={variant === "1" ? "mt-[20px] -mx-[20px]" : "mt-[20px]"}>
            <PaymentError variant={variant} title={err.title} message={err.message} action={err.action} onAction={() => {}} />
          </div>
        )}

        <div className="mt-[24px]"><PaymentButtons /></div>
        <div className="mt-[18px]"><CardFields /></div>
        <div className="mt-[12px]">
          <Button className="h-[48px] w-full text-[15px] font-semibold">Continue</Button>
        </div>

        <TrustBadges className="mt-[26px]" />

        <p className="mt-[14px] text-center text-[12px] leading-[18px] text-muted-foreground">
          By proceeding with the purchase, you agree to our{" "}
          <span className="text-primary font-medium">Terms of Service</span>,{" "}
          <span className="text-primary font-medium">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
