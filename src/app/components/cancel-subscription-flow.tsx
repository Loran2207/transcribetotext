import { useEffect, useState, type ReactNode } from "react";
import {
  AiBrain01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  GiftIcon,
  UserGroupIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Icon, type IconSvgElement } from "./ui/icon";
import { SourceIcon, type SourceType } from "./source-icons";

// Cancel-subscription flow: confirm -> (pause -> pauseDone) or
// (before -> files -> survey -> discount -> loading -> kept | gone).
// Opened from Settings > Plan management.

export type CancelFlowStep =
  | "confirm"
  | "pause"
  | "pauseDone"
  | "before"
  | "files"
  | "survey"
  | "discount"
  | "loading"
  | "kept"
  | "gone";

// "survey_other" opens the survey step with "Other" pre-selected (demo captures).
export type CancelFlowInitialStep = CancelFlowStep | "survey_other";

const ACTIVE_UNTIL = "May 22, 2026";
const PAUSED_UNTIL = "August 24, 2026";

const PAUSE_BENEFITS = [
  "Access every transcript processed during your active subscription",
  "Share your transcriptions with others",
  "Localize and repurpose completed documents for other languages or markets",
  "Stay in control of your content, even while you take a break",
];

interface BeforeFeature {
  icon: IconSvgElement;
  name: string;
  desc: string;
}

const BEFORE_FEATURES: BeforeFeature[] = [
  { icon: AiBrain01Icon, name: "Smart summaries", desc: "Turn long recordings into key takeaways in seconds" },
  { icon: UserGroupIcon, name: "Speaker recognition", desc: "See who said what in meetings and interviews" },
  { icon: Download01Icon, name: "Export anywhere", desc: "DOCX, PDF, SRT, TXT and more, ready to share" },
];

interface DemoFile {
  name: string;
  duration: string;
  source: SourceType;
}

const DEMO_FILES: DemoFile[] = [
  { name: "Weekly product sync - Q2 roadmap", duration: "32 min", source: "google-meet" },
  { name: "Acme Logistics - onboarding call", duration: "43 min", source: "zoom" },
  { name: "Sprint 14 standup - blockers", duration: "7 min", source: "teams" },
];

const SURVEY_REASONS = [
  "I don't use it",
  "It's too expensive",
  "I'm missing features I need",
  "Technical issues",
  "Quality is low",
  "Other",
];

const REASONS_WITH_DETAILS = new Set(["I'm missing features I need", "Other"]);

function StepTitle({ children }: { children: ReactNode }) {
  return (
    <DialogTitle className="text-center text-[19px] font-semibold tracking-tight">
      {children}
    </DialogTitle>
  );
}

function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center text-[13.5px] leading-[1.6]">
      {children}
    </div>
  );
}

function StatusCircle({ tone, icon }: { tone: "emerald" | "primary" | "muted"; icon: IconSvgElement }) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "primary"
        ? "bg-primary/10 text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <div className={`mx-auto flex size-14 items-center justify-center rounded-full ${toneClass}`}>
      <Icon icon={icon} size={26} strokeWidth={1.8} />
    </div>
  );
}

function DotLoader({ frozen }: { frozen: boolean }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (frozen) return;
    const id = window.setInterval(() => setTick((t) => (t + 1) % 4), 300);
    return () => window.clearInterval(id);
  }, [frozen]);
  // Clockwise on a 2x2 grid: top-left, top-right, bottom-right, bottom-left.
  const activeCell = [0, 1, 3, 2][tick];
  return (
    <div className="grid grid-cols-2 gap-2">
      {[0, 1, 2, 3].map((cell) => (
        <span
          key={cell}
          className={`size-2.5 rounded-full transition-colors duration-200 ${
            cell === activeCell ? "bg-primary" : "bg-muted-foreground/25"
          }`}
        />
      ))}
    </div>
  );
}

function LoadingBar({ frozen }: { frozen: boolean }) {
  const [width, setWidth] = useState(frozen ? 40 : 0);
  useEffect(() => {
    if (frozen) {
      setWidth(40);
      return;
    }
    const id = window.setTimeout(() => setWidth(90), 60);
    return () => window.clearTimeout(id);
  }, [frozen]);
  return (
    <div className="h-[2px] w-full max-w-[220px] overflow-hidden rounded-full bg-primary/10">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${width}%`, transition: frozen ? "none" : "width 1.7s ease-out" }}
      />
    </div>
  );
}

function ConfirmStep({ onCancel, onPause }: { onCancel: () => void; onPause: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>Are you sure?</StepTitle>
      <InfoBanner>
        Your subscription stays active until{" "}
        <span className="font-semibold text-primary">{ACTIVE_UNTIL}</span>. If you cancel,
        your account will be deactivated on that day.
      </InfoBanner>
      <p className="text-center text-[13px] leading-[1.6] text-muted-foreground">
        To keep access to your transcripts, tools and progress, consider pausing instead:
        you can return after a break and pick up right where you left off.
      </p>
      <div className="flex items-center gap-2.5 pt-1">
        <Button variant="pill-outline" onClick={onCancel} className="h-10 flex-1 text-[13.5px] font-medium">
          Cancel subscription
        </Button>
        <Button onClick={onPause} className="h-10 flex-1 text-[13.5px] font-semibold">
          Pause subscription
        </Button>
      </div>
    </div>
  );
}

function PauseStep({ onPause }: { onPause: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>Pause subscription</StepTitle>
      <InfoBanner>
        Take the time you need. Pause your subscription and come back whenever you're ready.
      </InfoBanner>
      <div>
        <p className="text-[14px] font-semibold">While paused, you can still:</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {PAUSE_BENEFITS.map((benefit) => (
            <div key={benefit} className="flex items-start gap-2.5">
              <Icon
                icon={CheckmarkCircle02Icon}
                size={18}
                strokeWidth={1.8}
                className="mt-px shrink-0 text-emerald-600"
              />
              <span className="text-[13px] leading-[1.55] text-foreground/90">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={onPause} className="h-10 w-full text-[13.5px] font-semibold">
        Pause subscription for 1 month
      </Button>
    </div>
  );
}

function PauseDoneStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StatusCircle tone="emerald" icon={CheckmarkCircle02Icon} />
      <div className="flex flex-col gap-2 text-center">
        <StepTitle>Subscription paused</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          You're paused until {PAUSED_UNTIL}. Your transcripts stay available the whole time.
        </p>
      </div>
      <Button onClick={onDone} className="h-10 w-full text-[13.5px] font-semibold">
        Back to dashboard
      </Button>
    </div>
  );
}

function BeforeStep({ onTry, onContinue }: { onTry: () => void; onContinue: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5 text-center">
        <StepTitle>Before you cancel</StepTitle>
        <p className="text-[13px] text-muted-foreground">
          You haven't tried the biggest time-savers yet
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {BEFORE_FEATURES.map((feature) => (
          <div key={feature.name} className="flex items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Icon icon={feature.icon} size={20} strokeWidth={1.7} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold">{feature.name}</p>
              <p className="text-[12.5px] text-muted-foreground">{feature.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5 pt-1">
        <Button onClick={onTry} className="h-10 flex-1 text-[13.5px] font-semibold">
          Try these features
        </Button>
        <Button variant="pill-outline" onClick={onContinue} className="h-10 flex-1 text-[13.5px] font-medium">
          Continue cancelling
        </Button>
      </div>
    </div>
  );
}

function FilesStep({ onDelete, onKeep }: { onDelete: () => void; onKeep: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>Delete all your files?</StepTitle>
      <div className="rounded-2xl border border-destructive/15 bg-destructive/5 p-4 text-center text-[13.5px] leading-[1.6]">
        Cancelling deletes your uploaded files and transcripts after {ACTIVE_UNTIL}.
      </div>
      <div className="divide-y divide-border rounded-2xl border border-border">
        {DEMO_FILES.map((file) => (
          <div key={file.name} className="flex items-center gap-3 px-4 py-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted/60">
              <SourceIcon source={file.source} />
            </div>
            <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{file.name}</span>
            <span className="shrink-0 text-[12.5px] tabular-nums text-muted-foreground">
              {file.duration}
            </span>
          </div>
        ))}
        <div className="px-4 py-3 text-[12.5px] text-muted-foreground">+ 9 more files</div>
      </div>
      <div className="flex items-center gap-2.5 pt-1">
        <Button
          variant="destructive-outline"
          onClick={onDelete}
          className="h-10 flex-1 text-[13.5px] font-medium"
        >
          Delete and cancel
        </Button>
        <Button onClick={onKeep} className="h-10 flex-1 text-[13.5px] font-semibold">
          Keep my files
        </Button>
      </div>
    </div>
  );
}

function SurveyStep({
  reason,
  details,
  onReasonChange,
  onDetailsChange,
  onContinue,
}: {
  reason: string | null;
  details: string;
  onReasonChange: (reason: string) => void;
  onDetailsChange: (value: string) => void;
  onContinue: () => void;
}) {
  const showDetails = reason !== null && REASONS_WITH_DETAILS.has(reason);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <StepTitle>We're sorry to see you go</StepTitle>
        <p className="text-[14px] font-semibold">Why do you want to cancel?</p>
      </div>
      <div className="flex flex-col gap-2">
        {SURVEY_REASONS.map((option) => {
          const selected = reason === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onReasonChange(option)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                selected ? "border-primary" : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-muted-foreground/40"
                }`}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="text-[13.5px] font-medium">{option}</span>
            </button>
          );
        })}
      </div>
      {showDetails && (
        <Textarea
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder="Tell us what's missing and we'll pass it to the team"
          className="min-h-24 rounded-2xl text-[13px]"
        />
      )}
      <Button
        onClick={onContinue}
        disabled={reason === null}
        className="h-10 w-full text-[13.5px] font-semibold"
      >
        Continue
      </Button>
    </div>
  );
}

function DiscountStep({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>A personal discount, before you go</StepTitle>
      <StatusCircle tone="primary" icon={GiftIcon} />
      <div className="flex items-baseline justify-center gap-2">
        <span className="text-[15px]">Only</span>
        <span className="text-[15px] text-muted-foreground line-through">$149.99</span>
        <span className="text-2xl font-bold text-primary">$39.99/year</span>
      </div>
      <div className="rounded-2xl bg-primary/5 p-4 text-center">
        <p className="text-[13.5px] font-semibold">We hope this discount encourages you to stay</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          We keep investing in new AI tools that save you hours every week.
        </p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <Button onClick={onAccept} className="h-10 w-full text-[13.5px] font-semibold">
          Get 95% off now
        </Button>
        <Button variant="link" onClick={onDecline} className="h-9 text-[13px] font-medium text-primary">
          I still want to cancel
        </Button>
      </div>
    </div>
  );
}

function LoadingStep({ frozen }: { frozen: boolean }) {
  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <DotLoader frozen={frozen} />
      <div className="flex flex-col gap-1.5 text-center">
        <StepTitle>Just a moment</StepTitle>
        <p className="text-[13px] text-muted-foreground">Please don't close this page</p>
      </div>
      <LoadingBar frozen={frozen} />
    </div>
  );
}

function KeptStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StatusCircle tone="emerald" icon={CheckmarkCircle02Icon} />
      <div className="flex flex-col gap-2 text-center">
        <StepTitle>Great decision!</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          Your 95% discount is applied. Your plan stays active at $39.99/year.
        </p>
      </div>
      <Button onClick={onDone} className="h-10 w-full text-[13.5px] font-semibold">
        Continue to dashboard
      </Button>
    </div>
  );
}

function GoneStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StatusCircle tone="muted" icon={UserIcon} />
      <StepTitle>Sorry to see you go</StepTitle>
      <div className="rounded-2xl bg-primary/5 p-4 text-center">
        <p className="text-[13.5px] font-semibold">Your subscription has been cancelled</p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          You keep access until {ACTIVE_UNTIL}. We hope to see you again.
        </p>
      </div>
      <Button onClick={onDone} className="h-10 w-full text-[13.5px] font-semibold">
        Done
      </Button>
    </div>
  );
}

interface CancelSubscriptionFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStep?: CancelFlowInitialStep;
}

export function CancelSubscriptionFlow({
  open,
  onOpenChange,
  initialStep = "confirm",
}: CancelSubscriptionFlowProps) {
  const [step, setStep] = useState<CancelFlowStep>("confirm");
  const [reason, setReason] = useState<string | null>(null);
  const [reasonDetails, setReasonDetails] = useState("");
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [outcome, setOutcome] = useState<"kept" | "gone">("kept");
  // Opened directly at "loading" (demo flag): freeze the loader for captures.
  const [frozenLoading, setFrozenLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const startsAtSurveyOther = initialStep === "survey_other";
    setStep(startsAtSurveyOther ? "survey" : initialStep);
    setReason(startsAtSurveyOther ? "Other" : null);
    setReasonDetails("");
    setDeleteFiles(false);
    setOutcome("kept");
    setFrozenLoading(initialStep === "loading");
  }, [open, initialStep]);

  useEffect(() => {
    if (!open || step !== "loading" || frozenLoading) return;
    const timer = window.setTimeout(() => setStep(outcome), 1900);
    return () => window.clearTimeout(timer);
  }, [open, step, frozenLoading, outcome]);

  function close() {
    onOpenChange(false);
  }

  function startProcessing(nextOutcome: "kept" | "gone") {
    setOutcome(nextOutcome);
    setFrozenLoading(false);
    setStep("loading");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl p-6 sm:max-w-[480px]" aria-describedby={undefined}>
        {step === "confirm" && (
          <ConfirmStep onCancel={() => setStep("before")} onPause={() => setStep("pause")} />
        )}
        {step === "pause" && <PauseStep onPause={() => setStep("pauseDone")} />}
        {step === "pauseDone" && <PauseDoneStep onDone={close} />}
        {step === "before" && <BeforeStep onTry={close} onContinue={() => setStep("files")} />}
        {step === "files" && (
          <FilesStep
            onDelete={() => {
              setDeleteFiles(true);
              setStep("survey");
            }}
            onKeep={() => {
              setDeleteFiles(false);
              setStep("survey");
            }}
          />
        )}
        {step === "survey" && (
          <SurveyStep
            reason={reason}
            details={reasonDetails}
            onReasonChange={setReason}
            onDetailsChange={setReasonDetails}
            onContinue={() => setStep("discount")}
          />
        )}
        {step === "discount" && (
          <DiscountStep
            onAccept={() => startProcessing("kept")}
            onDecline={() => startProcessing("gone")}
          />
        )}
        {step === "loading" && <LoadingStep frozen={frozenLoading} />}
        {step === "kept" && <KeptStep onDone={close} />}
        {step === "gone" && <GoneStep onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}
