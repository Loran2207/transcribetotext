import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Icon } from "./ui/icon";
import { CardFields, PaymentButtons, SummaryRow, TrustBadges } from "./checkout-parts";

/* The 75% win-back checkout, in the house design system.
   Same copy and the same layout as the brief: a promo panel and the checkout
   beside it on a wide screen, stacked below it on anything narrower.
   Route: /checkout-75. Design and capture only, like /checkout. */

const BODY =
  "We noticed you've cancelled your subscription, and we'd like to make things right. No promo codes. No catch. Just our way of saying: welcome back and let's make things easier";
const TAGLINE = "Save time. Save money. Get more done";
const GIFT = "/images/discount-gift.png";

function Header() {
  return (
    <header className="relative flex h-[72px] shrink-0 items-center justify-center px-4 md:px-5">
      <button
        type="button"
        aria-label="Back"
        className="absolute left-4 flex size-10 items-center justify-center rounded-full bg-primary/[0.08] text-primary md:left-5"
      >
        <Icon icon={ArrowLeft01Icon} className="size-5" />
      </button>
      <img src="/images/logo-full.svg" alt="TranscribeToText.AI" className="h-[24px] md:h-[26px]" draggable={false} />
    </header>
  );
}

function PromoPanel() {
  return (
    <section className="rounded-[22px] bg-muted px-5 py-6 md:flex md:items-center md:gap-10 md:px-10 md:py-10 lg:min-w-0 lg:flex-1 lg:flex-col lg:items-start lg:justify-center lg:gap-0 lg:px-12 lg:py-16">
      {/* Wide and tablet: the gift leads. On a phone it sits beside the headline
          instead, which is what the mobile brief does. */}
      <img src={GIFT} alt="" className="hidden shrink-0 md:block md:size-[132px] lg:mb-9 lg:size-[168px]" draggable={false} />
      <div className="min-w-0 max-md:flex max-md:items-start max-md:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold tracking-[-0.4px] text-foreground text-[20px] leading-[26px] md:text-[34px] md:leading-[42px] lg:text-[40px] lg:leading-[50px]">
            Great news - your <span className="whitespace-nowrap text-primary">75% discount</span> has been activated!
          </h1>
          <p className="hidden text-muted-foreground md:mt-5 md:block md:text-[15px] md:leading-[26px] lg:mt-7 lg:text-[17px] lg:leading-[29px]">
            {BODY}
          </p>
          <p className="mt-3 font-semibold text-primary text-[13px] leading-[19px] md:mt-6 md:text-[17px] md:leading-[24px] lg:mt-8 lg:text-[19px] lg:leading-[26px]">
            {TAGLINE}
          </p>
        </div>
        <img src={GIFT} alt="" className="size-[96px] shrink-0 md:hidden" draggable={false} />
      </div>
    </section>
  );
}

function CheckoutPanel() {
  return (
    <section className="md:rounded-[22px] md:bg-primary-wash md:px-10 md:py-10 lg:flex lg:min-w-0 lg:flex-1 lg:items-center lg:justify-center lg:px-12 lg:py-14">
      <div className="mx-auto w-full max-w-[508px] md:rounded-[22px] md:bg-card md:px-10 md:py-9 md:shadow-[var(--elevation-md)]">
        <h2 className="text-center font-bold tracking-[-0.3px] text-foreground text-[24px] leading-[30px] md:text-[28px] md:leading-[34px]">
          Complete Checkout
        </h2>

        <div className="mt-6 flex flex-col gap-2 md:mt-7">
          <span className="text-[13px] text-muted-foreground">Order summary</span>
          <SummaryRow
            label="Premium Membership"
            value={
              <>
                <span className="mr-2 font-normal text-muted-foreground line-through">$29.99</span>
                $7.49
              </>
            }
          />
          <SummaryRow label="Business Package" value="Free" />
          <SummaryRow label="Priority Processing" value="Free" />
          <SummaryRow label="Total today:" value="$7.49" bold />
          <p className="text-[15px] font-semibold text-success">You just saved $22.50 (75% OFF)</p>
        </div>

        <div className="mt-6"><PaymentButtons /></div>
        <div className="mt-4"><CardFields /></div>
        <div className="mt-3">
          <Button className="h-12 w-full text-[15px] font-semibold">Continue</Button>
        </div>

        <TrustBadges className="mt-6" />

        <p className="mt-4 text-center text-[12px] leading-[18px] text-muted-foreground">
          By proceeding with the purchase, you agree to our{" "}
          <span className="font-medium text-primary">Terms of Service</span>,{" "}
          <span className="font-medium text-primary">Privacy Policy</span>,{" "}
          <span className="font-medium text-primary">Subscription Policy</span>. Need help? Contact us at{" "}
          <span className="font-medium text-primary">support@transcribetotext.ai</span>
        </p>
        <p className="mt-2 text-center text-[12px] leading-[18px] text-muted-foreground">
          You'll pay $7.49 today for your 1-month trial. After your trial ends, it will convert into a subscription.
          You can cancel anytime in your account settings at least 24 hours before the end of your 1-month
          subscription. If you don't cancel, your membership will automatically renew at the end of each billing
          period.
        </p>
      </div>
    </section>
  );
}

export function CheckoutPromoPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex flex-1 flex-col gap-4 px-4 pb-6 md:gap-5 md:px-5 md:pb-8 lg:flex-row lg:items-stretch lg:gap-5 lg:px-5">
        <PromoPanel />
        {/* The brief draws a rule under the promo on a phone, where the two
            blocks share one white page instead of sitting on their own panels. */}
        <div className="mx-1 h-px bg-border md:hidden" />
        <CheckoutPanel />
      </main>
    </div>
  );
}
