import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "./auth-context";
import { toast } from "sonner";

export type PlanState = "never" | "active" | "expired";

const STATE_KEY = "plan-state-preview";

export function usePlanStatePreview() {
  const [state, setStateInternal] = useState<PlanState>("active");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATE_KEY);
      if (saved === "never" || saved === "active" || saved === "expired") {
        setStateInternal(saved);
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

const STATE_SEGMENTS: { id: PlanState; label: string }[] = [
  { id: "never", label: "Free" },
  { id: "active", label: "Active" },
  { id: "expired", label: "Expired" },
];

export function PlanStatePreview({
  value,
  onChange,
}: {
  value: PlanState;
  onChange: (next: PlanState) => void;
}) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-full bg-muted border border-border"
      role="tablist"
      aria-label="Preview different account states"
    >
      {STATE_SEGMENTS.map((seg) => {
        const active = value === seg.id;
        return (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(seg.id)}
            className={`h-7 px-3.5 rounded-full text-[12.5px] font-medium transition-all cursor-pointer ${
              active
                ? "bg-card text-foreground shadow-sm ring-1 ring-black/[0.04]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}

const BENEFITS = [
  { title: "Unlimited transcriptions", desc: "No daily caps, no queue." },
  { title: "Up to 4 hours per file", desc: "Long meetings, long lectures — no limits." },
  { title: "AI meeting agent", desc: "Joins Zoom, Meet & Teams to take notes for you." },
  { title: "Transcribe from links", desc: "Paste any URL — YouTube, Drive, Dropbox." },
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
    <div className="text-right shrink-0 pl-6 border-l border-border">
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
    <div className="grid grid-cols-3 mt-6 pt-5 border-t border-border">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={`flex flex-col gap-1 px-5 ${
            i === 0 ? "pl-0 border-l-0" : "border-l border-border"
          } ${i === cells.length - 1 ? "pr-0" : ""}`}
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
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="primary">Free plan</HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            Unlock the full power of Transcribetotext
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            You're on the Free plan — 1 transcription per day, up to 30
            minutes per file. Upgrade to remove every limit and let our AI
            agent join your meetings for you.
          </p>
        </div>
        <HeroPrice amount="$29.99" per="per month" note="Cancel anytime" />
      </div>

      <div className="flex gap-2.5 mt-6 items-center flex-wrap">
        <Button onClick={onUpgrade} className="h-10 px-6 text-[13.5px]">
          Get Premium
        </Button>
        <Button variant="pill-outline" className="h-10 px-5 text-[13.5px]">
          Compare to Free
        </Button>
      </div>

      <TrustLine>Secure payment · Cancel anytime · No hidden fees</TrustLine>
    </HeroShell>
  );
}

function HeroActive({
  memberSince,
  nextRenewal,
  paymentMethod,
}: {
  memberSince: string;
  nextRenewal: string;
  paymentMethod: string;
}) {
  return (
    <HeroShell tone="emerald">
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="emerald" pulse>
            Premium · active
          </HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            You're on Premium
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            Thanks for being a Premium member. Your subscription renews
            automatically — manage payment and billing below.
          </p>
        </div>
        <HeroPrice amount="$29.99" per="per month" />
      </div>

      <HeroMeta
        cells={[
          { label: "Member since", value: memberSince },
          { label: "Next renewal", value: nextRenewal },
          { label: "Payment method", value: paymentMethod },
        ]}
      />
    </HeroShell>
  );
}

function HeroExpired({ onRenew }: { onRenew: () => void }) {
  return (
    <HeroShell tone="amber">
      <div className="flex justify-between items-start gap-8">
        <div className="flex-1 min-w-0">
          <HeroEyebrow tone="amber">Premium · expired</HeroEyebrow>
          <h3 className="text-[22px] font-bold -tracking-[0.3px] mb-1.5 leading-[1.25]">
            Your Premium has expired
          </h3>
          <p className="text-[14px] text-muted-foreground leading-[1.55] max-w-[520px] m-0">
            Your subscription ended on Apr 12, 2026. You're back on the Free
            plan — pick up right where you left off and bring back unlimited
            transcriptions.
          </p>
        </div>
        <HeroPrice amount="$29.99" per="per month" note="Same price as before" />
      </div>

      <HeroMeta
        cells={[
          { label: "Was active", value: "Jan – Apr 2026" },
          { label: "Expired on", value: "Apr 12, 2026" },
          { label: "Files transcribed", value: "128 in total" },
        ]}
      />

      <div className="flex gap-2.5 mt-6 items-center flex-wrap">
        <Button onClick={onRenew} className="h-10 px-6 text-[13.5px]">
          Renew Premium
        </Button>
        <Button variant="pill-outline" className="h-10 px-5 text-[13.5px]">
          Stay on Free
        </Button>
      </div>

      <TrustLine>
        Your templates, folders and records are safe — they'll all reactivate
        the moment you renew.
      </TrustLine>
    </HeroShell>
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
    <div className="flex items-center gap-4 px-6 py-[18px] border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="text-[13px] text-muted-foreground mt-0.5">{desc}</div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function ManageSubscriptionCard({
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
        <ManageRow
          title="Cancel subscription"
          desc={`You'll keep Premium until ${endDate}, then move to Free.`}
          action={
            <Button
              variant="link"
              size="sm"
              className="h-9 px-1 text-[13.5px] text-primary"
              onClick={onCancel}
            >
              Cancel
            </Button>
          }
        />
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────

interface PlanManagementPageProps {
  state: PlanState;
}

export function PlanManagementPage({ state }: PlanManagementPageProps) {
  const { user } = useAuth();
  const billingEmail = user?.email || "you@example.com";

  function handleUpgrade() {
    toast("Upgrading is not enabled in this preview.");
  }
  function handleRenew() {
    toast("Renewal is not enabled in this preview.");
  }
  function handleUpdatePayment() {
    toast("Payment management is not enabled in this preview.");
  }
  function handleChangeBillingEmail() {
    toast("Billing email change is not enabled in this preview.");
  }
  function handleCancel() {
    toast("Cancellation is not enabled in this preview.");
  }

  return (
    <div className="flex flex-col">
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
          <HeroActive
            memberSince="Jan 12, 2026"
            nextRenewal="May 12, 2026"
            paymentMethod="Visa · 4242"
          />
          <ManageSubscriptionCard
            billingEmail={billingEmail}
            endDate="May 12, 2026"
            onUpdatePayment={handleUpdatePayment}
            onChangeEmail={handleChangeBillingEmail}
            onCancel={handleCancel}
          />
          <BenefitsCard title="What your plan includes" />
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
