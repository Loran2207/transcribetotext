import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "./auth-context";
import { toast } from "sonner";
import {
  CancelSubscriptionFlow,
  type CancelFlowInitialStep,
} from "./cancel-subscription-flow";

export type PlanState = "never" | "active" | "expired";

const STATE_KEY = "plan-state-preview";

export function usePlanStatePreview() {
  const [state, setStateInternal] = useState<PlanState>("active");

  useEffect(() => {
    try {
      const url = new URLSearchParams(window.location.search).get("plan");
      const flag =
        url ||
        localStorage.getItem("ttt_demo_plan") ||
        localStorage.getItem(STATE_KEY);
      if (flag === "never" || flag === "active" || flag === "expired") {
        setStateInternal(flag);
      }
    } catch {
      // ignore
    }
  }, []);

  function setState(next: PlanState) {
    setStateInternal(next);
    try {
      localStorage.setItem(STATE_KEY, next);
    } catch {
      // ignore
    }
  }

  return [state, setState] as const;
}

const BENEFITS = [
  { title: "Unlimited transcriptions", desc: "No daily caps, no queue." },
  { title: "Up to 4 hours per file", desc: "Long meetings, long lectures - no limits." },
  { title: "AI meeting agent", desc: "Joins Zoom, Meet & Teams to take notes for you." },
  { title: "Transcribe from links", desc: "Paste any URL - YouTube, Instagram, Drive, Dropbox." },
  { title: "Priority processing", desc: "Files are processed first, even at peak times." },
  { title: "Premium support", desc: "Direct line to our team, faster responses." },
];

function CheckBadge() {
  return (
    <span className="size-[18px] rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-emerald-500/15 text-emerald-600">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 13l4 4L19 7" />
      </svg>
    </span>
  );
}

function BenefitsCard({ title }: { title: string }) {
  return (
    <section>
      <h3 className="text-[15px] font-semibold mb-3.5 -tracking-[0.1px]">
        {title}
      </h3>
      <div className="rounded-[18px] border border-border bg-card px-7 py-6 mb-9">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-[18px]">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3 items-start">
              <CheckBadge />
              <div className="text-[13.5px] leading-[1.5]">
                <strong className="font-semibold block">{b.title}</strong>
                <span className="block text-muted-foreground text-[13px] mt-0.5 font-normal">
                  {b.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

type Tone = "primary" | "emerald" | "amber";

function HeroEyebrow({
  tone,
  pulse,
  children,
}: {
  tone: Tone;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  const styles =
    tone === "primary"
      ? "bg-primary/10 text-primary"
      : tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-600"
      : "bg-amber-500/15 text-amber-700";

  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[12px] font-medium mb-2.5 ${styles}`}
    >
      <span
        className={`size-1.5 rounded-full bg-current ${pulse ? "animate-pulse" : ""}`}
      />
      {children}
    </span>
  );
}

function HeroShell({
  tone,
  children,
}: {
  tone: Tone;
  children: React.ReactNode;
}) {
  const wrapperClass =
    tone === "primary"
      ? "bg-gradient-to-br from-primary/[0.09] to-primary/[0.02]"
      : tone === "emerald"
      ? "bg-gradient-to-br from-emerald-500/[0.10] to-emerald-50/40"
      : "bg-gradient-to-br from-amber-500/[0.12] to-amber-50/40";

  return (
    <div className={`rounded-[20px] p-1 mb-9 border border-border ${wrapperClass}`}>
      <div className="bg-card rounded-[17px] px-7 py-6 sm:px-8 sm:py-7">
        {children}
      </div>
    </div>
  );
}

function HeroPrice({
  amount,
  per,
  note,
}: {
  amount: string;
  per: string;
  note?: string;
}) {
  return (
    <div className="shrink-0 max-md:w-full max-md:border-t max-md:border-border max-md:pt-4 md:border-l md:border-border md:pl-6 md:text-right">
      <div className="text-[30px] font-bold leading-none -tracking-[0.5px]">
        {amount}
      </div>
      <div className="text-[13px] text-muted-foreground mt-1.5">{per}</div>
      {note ? (
        <div className="text-[12px] text-muted-foreground mt-2.5">{note}</div>
      ) : null}
    </div>
  );
}

function HeroMeta({
  cells,
}: {
  cells: { label: string; value: string }[];
}) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-y-3.5 border-t border-border pt-5 md:grid-cols-3 md:gap-y-0">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={`flex flex-col gap-1 max-md:px-0 md:px-5 ${
            i === 0 ? "md:border-l-0 md:pl-0" : "md:border-l md:border-border"
          } ${i === cells.length - 1 ? "md:pr-0" : ""}`}
        >
          <div className="text-[12px] text-muted-foreground">{c.label}</div>
          <div className="text-[14.5px] font-semibold -tracking-[0.1px]">
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function TrustLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-4 text-[12.5px] text-muted-foreground">
      <svg
        className="text-emerald-600 shrink-0"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span>{children}</span>
    </div>
  );
}

// ── Hero variants ────────────────────────────────────────────

function HeroFree({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <HeroShell tone="primary">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="primary">Free plan</HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            Unlock the full power of Transcribetotext
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            You're on the Free plan - 1 transcription per day, up to 30
            minutes per file. Upgrade to remove every limit and let our AI
            agent join your meetings for you.
          </p>
        </div>
        <HeroPrice amount="$19.99" per="per month" note="Cancel anytime" />
      </div>

      <div className="flex gap-2.5 mt-6 items-center flex-wrap">
        <Button onClick={onUpgrade} className="h-10 px-6 text-[13.5px]">
          Get Premium
        </Button>
      </div>

      <TrustLine>Secure payment · Cancel anytime · No hidden fees</TrustLine>
    </HeroShell>
  );
}

export function HeroActive({
  billingEmail,
  duration,
  price,
}: {
  billingEmail: string;
  duration: string;
  price: string;
}) {
  return (
    <HeroShell tone="emerald">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="emerald" pulse>
            Premium · active
          </HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            You're on Premium
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            Thanks for being a Premium member. Your subscription renews
            automatically - manage payment and billing below.
          </p>
        </div>
        <HeroPrice amount="$19.99" per="per month" />
      </div>

      <HeroMeta
        cells={[
          { label: "email", value: billingEmail },
          { label: "duration", value: duration },
          { label: "price", value: price },
        ]}
      />
    </HeroShell>
  );
}

function HeroExpired({ onRenew }: { onRenew: () => void }) {
  return (
    <HeroShell tone="amber">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="amber">Premium · expired</HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            Your Premium has expired
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            Your subscription ended on Apr 12, 2026. You're back on the Free
            plan - pick up right where you left off and bring back unlimited
            transcriptions.
          </p>
        </div>
        <HeroPrice amount="$19.99" per="per month" note="Same price as before" />
      </div>

      <HeroMeta
        cells={[
          { label: "Was active", value: "Jan - Apr 2026" },
          { label: "Expired on", value: "Apr 12, 2026" },
          { label: "Files transcribed", value: "128 in total" },
        ]}
      />

      <div className="flex gap-2.5 mt-6 items-center flex-wrap">
        <Button onClick={onRenew} className="h-10 px-6 text-[13.5px]">
          Renew Premium
        </Button>
      </div>

      <TrustLine>
        Your templates, folders and records are safe - they'll all reactivate
        the moment you renew.
      </TrustLine>
    </HeroShell>
  );
}

function PauseCard({ onPause }: { onPause: () => void }) {
  return (
    <div className="mb-6 rounded-[18px] border border-border bg-card px-6 py-6 shadow-[var(--elevation-sm)]">
      <CardTitle>Need a break?</CardTitle>
      <p className="mt-2 text-balance text-[13.5px] leading-[1.55] text-muted-foreground">
        Take the time you need. Pause your subscription and come back whenever you're ready
      </p>
      <Button
        variant="warning"
        onClick={onPause}
        className="mt-5 h-12 w-full text-[14px] font-semibold"
      >
        Pause Subscription
      </Button>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3.5 text-[20px] font-bold -tracking-[0.3px]">{children}</h3>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-balance text-[18px] font-bold leading-[1.3] -tracking-[0.2px]">
      {children}
    </h3>
  );
}

// ── Plan card ────────────────────────────────────────────────
// Badge plus the three facts the product states: who is billed, how often,
// how much.
type PlanStatus = "active" | "paused" | "cancelled" | "expired";

// The tinted edge is written in rgba on purpose: the Figma capture pipeline
// drops oklch and color-mix, and a Tailwind gradient here comes back grey.
const PLAN_BADGE: Record<
  PlanStatus,
  { label: string; heading: string; cls: string; wash: string; dot: string }
> = {
  active: {
    label: "Active",
    heading: "You're on Premium",
    cls: "bg-emerald-500/15 text-emerald-700",
    wash: "linear-gradient(135deg, rgba(16,185,129,0.42) 0%, rgba(16,185,129,0.16) 45%, rgba(16,185,129,0.06) 100%)",
    dot: "bg-emerald-500",
  },
  paused: {
    label: "Paused",
    heading: "Your plan is on pause",
    cls: "bg-warning/15 text-amber-700",
    wash: "linear-gradient(135deg, rgba(240,177,0,0.45) 0%, rgba(240,177,0,0.16) 45%, rgba(240,177,0,0.06) 100%)",
    dot: "bg-warning",
  },
  cancelled: {
    label: "Cancelled",
    heading: "Your plan is cancelled",
    cls: "bg-destructive/10 text-destructive",
    wash: "linear-gradient(135deg, rgba(238,26,26,0.30) 0%, rgba(238,26,26,0.10) 45%, rgba(238,26,26,0.04) 100%)",
    dot: "bg-destructive",
  },
  expired: {
    label: "Expired",
    heading: "Your Premium has expired",
    cls: "bg-muted text-muted-foreground",
    wash: "linear-gradient(135deg, rgba(113,113,122,0.30) 0%, rgba(113,113,122,0.10) 45%, rgba(113,113,122,0.04) 100%)",
    dot: "bg-muted-foreground",
  },
};

function PlanCard({
  status,
  rows,
}: {
  status: PlanStatus;
  rows: { label: string; value: string }[];
}) {
  const badge = PLAN_BADGE[status];
  return (
    <div
      className="mb-9 max-w-[600px] rounded-[22px] p-[6px] shadow-[0px_10px_28px_rgba(16,24,40,0.06)]"
      style={{ background: badge.wash }}
    >
      <div className="rounded-[17px] bg-card px-7 py-6 shadow-[var(--elevation-sm)]">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12.5px] font-semibold ${badge.cls}`}
        >
          <span className={`size-1.5 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
        <h3 className="mt-3.5 text-[26px] font-bold leading-[1.15] -tracking-[0.6px]">
          {badge.heading}
        </h3>
        <div className="mt-6 grid grid-cols-1 gap-y-4 border-t border-border pt-5 sm:grid-cols-[1.5fr_1fr_1fr] sm:gap-y-0">
          {rows.map((r, i) => (
            <div
              key={r.label}
              className={`flex min-w-0 flex-col gap-1 sm:px-5 ${
                i === 0 ? "sm:pl-0" : "sm:border-l sm:border-border"
              } ${i === rows.length - 1 ? "sm:pr-0" : ""}`}
            >
              <span className="text-[12px] text-muted-foreground">{r.label}</span>
              <span className="truncate text-[14.5px] font-semibold -tracking-[0.1px]">
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Premium benefits, the product's own list ─────────────────
const PREMIUM_BENEFITS = [
  {
    title: "Unlimited audio & video transcriptions",
    desc: "Unlock unlimited transcriptions with up to 4 hours per conversation. Easily import audio and video files, no limits, no stress",
  },
  {
    title: "AI Meeting Agent",
    desc: "Let AI join your Zoom, Google Meet, or MS Teams calls to take notes, record audio, and instantly share everything, so you never miss a thing",
  },
  {
    title: "Transcribe from Links",
    desc: "Turn YouTube videos, Google Drive, and Dropbox files into clear, accurate transcripts in seconds",
  },
];

function PremiumBenefitsCard() {
  return (
    <div className="mb-6 rounded-[18px] border border-border bg-card px-6 py-6 shadow-[var(--elevation-sm)]">
      <CardTitle>Transcribetotext.ai Premium membership gives you</CardTitle>
      <div className="mt-5 flex flex-col gap-4">
        {PREMIUM_BENEFITS.map((b) => (
          <div key={b.title} className="flex items-start gap-3">
            <CheckBadge />
            <div className="min-w-0 text-[13.5px] leading-[1.55]">
              <strong className="block font-semibold">{b.title}</strong>
              <span className="mt-0.5 block text-[13px] text-muted-foreground">{b.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Cancelling block, worded the way the product words it
function CancellingCard({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="mb-6 rounded-[18px] border border-border bg-card px-6 py-6 shadow-[var(--elevation-sm)]">
      <CardTitle>Cancelling Subscription?</CardTitle>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-muted-foreground">
        Canceling your subscription will stop your access to all premium transcription features and
        stored transcripts. If you have purchased or generated any files, please make sure to
        download them before canceling
      </p>
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Button
          variant="pill-outline"
          onClick={onCancel}
          className="h-12 w-full text-[14px] font-semibold"
        >
          Cancel Subscription
        </Button>
        <Button
          onClick={() => {
            window.location.href = "mailto:support@transcribetotext.ai";
          }}
          className="h-12 w-full text-[14px] font-semibold"
        >
          Contact Support
        </Button>
      </div>
    </div>
  );
}

// ── Manage subscription card ─────────────────────────────────

function ManageRow({
  title,
  desc,
  action,
}: {
  title: string;
  desc: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-start gap-3 border-b border-border px-5 py-4 last:border-b-0 md:flex-row md:items-center md:gap-4 md:px-6 md:py-[18px]">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

export function ManageSubscriptionCard({
  billingEmail,
  endDate,
  onUpdatePayment,
  onChangeEmail,
  onCancel,
}: {
  billingEmail: string;
  endDate: string;
  onUpdatePayment: () => void;
  onChangeEmail: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mb-9">
      <h3 className="text-[15px] font-semibold mb-3.5 -tracking-[0.1px]">
        Manage subscription
      </h3>
      <div className="rounded-[18px] border border-border bg-card overflow-hidden">
        <ManageRow
          title="Payment method"
          desc="Visa ending in 4242 · Expires 09/28"
          action={
            <Button
              variant="pill-outline"
              size="sm"
              className="h-9 px-4 text-[13px]"
              onClick={onUpdatePayment}
            >
              Update
            </Button>
          }
        />
        <ManageRow
          title="Billing email"
          desc={`Receipts are sent to ${billingEmail}`}
          action={
            <Button
              variant="pill-outline"
              size="sm"
              className="h-9 px-4 text-[13px]"
              onClick={onChangeEmail}
            >
              Change
            </Button>
          }
        />

      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────

const CANCEL_DEMO_STEPS: Record<string, CancelFlowInitialStep> = {
  confirm: "confirm",
  pause: "pause",
  pausedone: "pauseDone",
  before: "before",
  files: "files",
  survey: "survey",
  survey_other: "surveyDetails",
  survey_details: "surveyDetails",
  discount: "discount",
  loading: "loading",
  kept: "kept",
  gone: "gone",
};

interface PlanManagementPageProps {
  state: PlanState;
}

export function PlanManagementPage({ state }: PlanManagementPageProps) {
  const { user } = useAuth();
  const billingEmail = user?.email || "you@example.com";
  const [cancelFlowOpen, setCancelFlowOpen] = useState(false);
  const [cancelFlowStep, setCancelFlowStep] = useState<CancelFlowInitialStep>("confirm");

  // Demo/capture flag: ttt_demo_cancel=<step> auto-opens the cancel flow at that step.
  useEffect(() => {
    try {
      const flag = localStorage.getItem("ttt_demo_cancel");
      if (flag && Object.prototype.hasOwnProperty.call(CANCEL_DEMO_STEPS, flag)) {
        setCancelFlowStep(CANCEL_DEMO_STEPS[flag]);
        setCancelFlowOpen(true);
      }
    } catch {
      // ignore
    }
  }, []);

  function handleUpgrade() {
    toast("Upgrading is not enabled in this preview.");
  }
  function handleRenew() {
    toast("Renewal is not enabled in this preview.");
  }
  function handleCancel() {
    setCancelFlowStep("confirm");
    setCancelFlowOpen(true);
  }
  function handlePause() {
    setCancelFlowStep("pause");
    setCancelFlowOpen(true);
  }

  return (
    <div className="flex flex-col">
      <CancelSubscriptionFlow
        open={cancelFlowOpen}
        onOpenChange={setCancelFlowOpen}
        initialStep={cancelFlowStep}
      />
      {state === "never" && (
        <>
          <HeroFree onUpgrade={handleUpgrade} />
          <BenefitsCard title="What you get with Premium" />
          <p className="text-center text-[13px] text-muted-foreground pt-1">
            Have questions?{" "}
            <a
              href="mailto:support@transcribetotext.app"
              className="text-primary hover:underline"
            >
              Talk to our team
            </a>
            .
          </p>
        </>
      )}

      {state === "active" && (
        <>
          <SectionTitle>My plans</SectionTitle>
          <PlanCard
            status="active"
            rows={[
              { label: "email", value: billingEmail },
              { label: "duration", value: "week" },
              { label: "price", value: "$19.99" },
            ]}
          />
          <PremiumBenefitsCard />
          <PauseCard onPause={handlePause} />
          <CancellingCard onCancel={handleCancel} />
        </>
      )}

      {state === "expired" && (
        <>
          <HeroExpired onRenew={handleRenew} />
          <BenefitsCard title="What you get back" />
        </>
      )}
    </div>
  );
}
