import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { DialogHero } from "./dialog-hero";
import { Icon } from "./ui/icon";
import { CardFields, PaymentButtons, SummaryRow, TrustBadges } from "./checkout-parts";

/* The 75% win-back checkout, in the house design system.
   Copy and layout follow the brief: the offer and the checkout side by side on
   a wide screen, stacked below it on anything narrower. The surfaces are ours -
   a white page, the halo the plan dialogs put behind this same gift, and one
   raised card - instead of the brief's grey and blue slabs.
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
        className="absolute left-2 flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:left-3"
      >
        <Icon icon={ArrowLeft02Icon} className="size-5" strokeWidth={2} />
      </button>
      <img src="/images/logo-full.svg" alt="TranscribeToText.AI" className="h-[24px] md:h-[26px]" draggable={false} />
    </header>
  );
}

function Offer() {
  return (
    <section className="px-2 pb-5 md:flex md:items-center md:gap-9 md:px-2 md:py-4 lg:flex-1 lg:flex-col lg:items-start lg:justify-center lg:gap-0 lg:px-8 lg:py-0">
      {/* Wide and tablet: the gift leads. On a phone it sits beside the
          headline instead, which is what the mobile brief does. */}
      <DialogHero src={GIFT} alt="Gift box" className="mx-0 hidden shrink-0 md:flex md:size-[132px] lg:mb-8 lg:size-[168px]" />
      <div className="min-w-0 max-md:flex max-md:items-center max-md:gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="font-bold tracking-[-0.4px] text-foreground text-[21px] leading-[27px] md:text-[34px] md:leading-[42px] lg:text-[40px] lg:leading-[50px]">
            Great news - your <span className="whitespace-nowrap text-primary">75% discount</span> has been activated!
          </h1>
          <p className="hidden text-muted-foreground md:mt-5 md:block md:text-[15px] md:leading-[26px] lg:mt-7 lg:text-[17px] lg:leading-[29px]">
            {BODY}
          </p>
          <p className="mt-2.5 font-semibold text-primary text-[13px] leading-[19px] md:mt-6 md:text-[17px] md:leading-[24px] lg:mt-8 lg:text-[19px] lg:leading-[26px]">
            {TAGLINE}
          </p>
        </div>
        <DialogHero src={GIFT} alt="" className="mx-0 size-[104px] shrink-0 md:hidden" />
      </div>
    </section>
  );
}

function Checkout() {
  return (
    <section className="lg:flex lg:flex-1 lg:items-center lg:justify-center lg:px-8">
      <div className="mx-auto w-full max-w-[508px] md:rounded-[22px] md:border md:border-border md:bg-card md:p-8 md:shadow-[var(--elevation-md)]">
        <h2 className="text-center font-bold tracking-[-0.3px] text-foreground text-[24px] leading-[30px] md:text-[26px] md:leading-[32px]">
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
          {/* The saving is a chip, the same one the toasts use for good news. */}
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-success-wash px-3 py-1 text-[13px] font-semibold text-success">
            You just saved $22.50 (75% OFF)
          </span>
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
      <main className="flex flex-1 flex-col gap-2 px-4 pb-8 md:gap-4 md:px-6 lg:flex-row lg:items-stretch lg:gap-4 lg:px-8 lg:pb-10">
        <Offer />
        {/* The brief draws a rule under the offer on a phone, where the two
            blocks share one white page instead of sitting on their own panels. */}
        <div className="mx-1 h-px bg-border md:hidden" />
        <Checkout />
      </main>
    </div>
  );
}
