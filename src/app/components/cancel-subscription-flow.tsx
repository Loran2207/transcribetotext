import { useEffect, useState, type ReactNode } from "react";
import {
  AiBrain01Icon,
  Alert02Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Textarea } from "./ui/textarea";
import { Icon, type IconSvgElement } from "./ui/icon";
import { LottieStage } from "./checkout-loader/lottie-stage";
import { ACTIVE_UNTIL, PAUSED_UNTIL } from "./billing-dates";
import { DialogHero } from "./dialog-hero";

// Cancel-subscription flow, opened from Settings > Plan management:
// confirm -> (pause -> pauseDone) or
// (before -> files -> survey -> [surveyDetails] -> discount -> loading -> kept | gone).
//
// Two step families, one shell:
//   * Ask steps (confirm, pause, before, survey, surveyDetails) put the title on
//     the left and stack the question below it.
//   * Show steps (files, discount, loading, pauseDone, kept, gone) lead with a
//     centred hero image and centre the title under it.
// Every step is a `flex flex-col gap-5` inside the same padded shell, so the
// spacing rhythm and the close button never move between steps.

export type CancelFlowStep =
  | "confirm"
  | "pause"
  | "pauseDone"
  | "before"
  | "files"
  | "survey"
  | "surveyDetails"
  | "discount"
  | "loading"
  | "kept"
  | "gone";

// "survey_other" opens the reason follow-up straight away (demo captures).
export type CancelFlowInitialStep = CancelFlowStep | "survey_other";

const FULL_PRICE = "$149.99";
const DEAL_PRICE = "$39.99";
const DEAL_PER_DAY = "$0.11";
const DEAL_SAVING = "Save 73%";

const PAUSE_BENEFITS = [
  "Access every transcript processed during your active subscription",
  "Share your transcriptions with others",
  "Localize and repurpose completed documents for other languages or markets",
  "Stay in control of your content, even while you take a break",
];

const DISCOUNT_BENEFITS = [
  "Keep every transcript and summary you have made",
  "All AI tools stay unlocked, no limits",
  "Cancel anytime, no lock-in",
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

interface DeleteItem {
  icon: IconSvgElement;
  label: string;
  count: string;
}

// What cancelling actually destroys, counted. The numbers are the argument on
// this step, so they get the weight instead of a list of file names.
const DELETE_ITEMS: DeleteItem[] = [
  { icon: File01Icon, label: "Transcribed files", count: "17" },
  { icon: AiBrain01Icon, label: "AI-generated summaries", count: "4" },
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
const DEFAULT_DETAIL_REASON = "I'm missing features I need";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

// Aligns the built-in dialog close button with the p-6 content inset and softens
// it, so the X no longer sits tighter to the corner than the title does.
const SHELL =
  "rounded-2xl p-6 sm:max-w-[480px] [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-60";

function StepTitle({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  // Centred titles clear the close button on both sides, otherwise the padding
  // pushes the text off the optical centre of the dialog.
  return (
    <DialogTitle
      className={`text-[18px] font-semibold tracking-tight ${
        centered ? "px-8 text-center" : "pr-8 text-left"
      }`}
    >
      {children}
    </DialogTitle>
  );
}

// Back and Skip live on one row above the content, so they never collide with
// the close button and never shift the title.
function StepChrome({ onBack, onSkip }: { onBack?: () => void; onSkip?: () => void }) {
  if (!onBack && !onSkip) return null;
  return (
    <div className="-mb-1 -mt-1 flex h-8 items-center justify-between">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label="Go back"
          className="flex size-8 items-center justify-center rounded-full bg-primary/5 text-primary transition-colors hover:bg-primary/10"
        >
          <Icon icon={ArrowLeft01Icon} size={18} strokeWidth={1.9} />
        </button>
      ) : (
        <span />
      )}
      {onSkip ? (
        <button
          type="button"
          onClick={onSkip}
          className="mr-11 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Skip
        </button>
      ) : null}
    </div>
  );
}

function InfoBanner({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return (
    <div
      className={`rounded-2xl border border-primary/10 bg-primary/5 p-4 text-[13px] leading-[1.6] ${
        centered ? "text-center" : "text-left"
      }`}
    >
      {children}
    </div>
  );
}

function StepFooter({ children }: { children: ReactNode }) {
  // Two balanced actions: right-aligned, secondary to the left of primary.
  return <div className="flex items-center justify-end gap-2.5">{children}</div>;
}

function LoadingBar({ frozen }: { frozen: boolean }) {
  const [width, setWidth] = useState(frozen ? 45 : 0);
  useEffect(() => {
    if (frozen) {
      setWidth(45);
      return;
    }
    const id = window.setTimeout(() => setWidth(92), 60);
    return () => window.clearTimeout(id);
  }, [frozen]);
  return (
    <div className="h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-primary/10">
      <div
        className="h-full rounded-full bg-primary"
        style={{ width: `${width}%`, transition: frozen ? "none" : "width 1.7s ease-out" }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Steps
// ---------------------------------------------------------------------------

function ConfirmStep({ onCancel, onPause }: { onCancel: () => void; onPause: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepTitle>Are you sure?</StepTitle>
      <InfoBanner>
        Your subscription stays active until{" "}
        <span className="font-semibold text-primary">{ACTIVE_UNTIL}</span>. If you cancel, your account
        will be deactivated on that day.
      </InfoBanner>
      <p className="text-[13px] leading-[1.6] text-muted-foreground">
        To keep access to your transcripts, tools and progress, consider pausing instead: you can return
        after a break and pick up right where you left off.
      </p>
      <StepFooter>
        <Button variant="pill-outline" onClick={onCancel} className="h-10 px-5 text-[13.5px] font-medium">
          Cancel subscription
        </Button>
        <Button onClick={onPause} className="h-10 px-5 text-[13.5px] font-semibold">
          Pause subscription
        </Button>
      </StepFooter>
    </div>
  );
}

function PauseStep({ onBack, onPause }: { onBack: () => void; onPause: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} />
      <StepTitle>Pause subscription</StepTitle>
      <InfoBanner>
        Take the time you need. Pause your subscription and come back whenever you're ready.
      </InfoBanner>
      <div className="flex flex-col gap-2.5">
        <p className="text-[13.5px] font-semibold">While paused, you can still:</p>
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
      <Button onClick={onPause} className="h-11 w-full text-[13.5px] font-semibold">
        Pause subscription for 1 month
      </Button>
    </div>
  );
}

function PauseDoneStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <DialogHero src="/images/paused-symbol.png" alt="Paused" />
        <StepTitle centered>Subscription paused</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          You're paused until {PAUSED_UNTIL}. Your transcripts stay available the whole time.
        </p>
      </div>
      <Button onClick={onDone} className="h-11 w-full text-[13.5px] font-semibold">
        Back to dashboard
      </Button>
    </div>
  );
}

function BeforeStep({
  onBack,
  onTry,
  onContinue,
}: {
  onBack: () => void;
  onTry: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} onSkip={onContinue} />
      <div className="flex flex-col gap-1.5">
        <StepTitle>Before you cancel</StepTitle>
        <p className="text-[13px] text-muted-foreground">You haven't tried the biggest time-savers yet</p>
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
      <StepFooter>
        <Button variant="pill-outline" onClick={onContinue} className="h-10 px-5 text-[13.5px] font-medium">
          Continue cancelling
        </Button>
        <Button onClick={onTry} className="h-10 px-5 text-[13.5px] font-semibold">
          Try these features
        </Button>
      </StepFooter>
    </div>
  );
}

function FilesStep({
  onBack,
  onDelete,
  onKeep,
}: {
  onBack: () => void;
  onDelete: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} onSkip={onKeep} />
      <div className="flex flex-col items-center gap-3 text-center">
        <DialogHero src="/images/files-folder.png" alt="Folder with documents" tone="danger" />
        <StepTitle centered>Delete all your files?</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          If you cancel now, everything you have generated is deleted permanently after {ACTIVE_UNTIL},
          including:
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-border">
        {DELETE_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
              <Icon icon={item.icon} size={18} strokeWidth={1.8} className="text-primary" />
            </span>
            <span className="min-w-0 flex-1 text-[13px] font-medium">{item.label}</span>
            <span className="shrink-0 text-[16px] font-semibold tabular-nums">{item.count}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2">
        <Icon icon={Alert02Icon} size={15} strokeWidth={1.9} className="shrink-0 text-destructive" />
        <span className="text-[12.5px] text-muted-foreground">
          This action is final and cannot be undone.
        </span>
      </div>
      <StepFooter>
        <Button
          variant="destructive-outline"
          onClick={onDelete}
          className="h-10 px-5 text-[13.5px] font-medium"
        >
          Delete everything
        </Button>
        <Button onClick={onKeep} className="h-10 px-5 text-[13.5px] font-semibold">
          Exit without deleting
        </Button>
      </StepFooter>
    </div>
  );
}

function SurveyStep({
  reason,
  onBack,
  onSkip,
  onReasonChange,
  onContinue,
}: {
  reason: string | null;
  onBack: () => void;
  onSkip: () => void;
  onReasonChange: (reason: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} onSkip={onSkip} />
      <div className="flex flex-col gap-1.5">
        <StepTitle>We're sorry to see you go</StepTitle>
        <p className="text-[13px] text-muted-foreground">Why do you want to cancel?</p>
      </div>
      <div className="flex flex-col gap-2">
        {SURVEY_REASONS.map((option) => {
          const selected = reason === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onReasonChange(option)}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground/40"
              }`}
            >
              <span
                className={`flex size-[18px] shrink-0 items-center justify-center rounded-full border-2 ${
                  selected ? "border-primary" : "border-muted-foreground/40"
                }`}
              >
                {selected && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className={`text-[13.5px] ${selected ? "font-semibold" : "font-medium"}`}>{option}</span>
            </button>
          );
        })}
      </div>
      <Button
        onClick={onContinue}
        disabled={reason === null}
        className="h-11 w-full text-[13.5px] font-semibold"
      >
        Continue
      </Button>
    </div>
  );
}

// Follow-up for the reasons that carry an answer worth reading. The chosen
// reason becomes the title, so the question never has to repeat it.
function SurveyDetailsStep({
  reason,
  details,
  onBack,
  onSkip,
  onDetailsChange,
  onContinue,
}: {
  reason: string;
  details: string;
  onBack: () => void;
  onSkip: () => void;
  onDetailsChange: (value: string) => void;
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} onSkip={onSkip} />
      <div className="flex flex-col gap-1.5">
        <StepTitle>{reason}</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          Tell us what you expected from the app and we will pass it straight to the team.
        </p>
      </div>
      <Textarea
        value={details}
        onChange={(e) => onDetailsChange(e.target.value)}
        placeholder="Please enter your message here"
        className="min-h-28 rounded-2xl text-[13px]"
      />
      <Button onClick={onContinue} className="h-11 w-full text-[13.5px] font-semibold">
        Continue
      </Button>
    </div>
  );
}

function DiscountStep({
  onBack,
  onAccept,
  onDecline,
}: {
  onBack: () => void;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <StepChrome onBack={onBack} />
      <div className="flex flex-col items-center gap-3 text-center">
        <DialogHero src="/images/discount-gift.png" alt="Gift box" size="lg" />
        <StepTitle centered>Best price before you go</StepTitle>
      </div>
      <div className="flex flex-col items-center gap-2.5">
        <div className="flex items-baseline justify-center gap-2.5">
          <span className="text-[15px] text-muted-foreground line-through">{FULL_PRICE}</span>
          <span className="text-[40px] font-bold leading-none tracking-tight">{DEAL_PRICE}</span>
          <span className="text-[14px] text-muted-foreground">/year</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-destructive px-3 py-1 text-[12px] font-semibold text-destructive-foreground">
            {DEAL_SAVING}
          </span>
          <span className="text-[12.5px] text-muted-foreground">just {DEAL_PER_DAY} a day</span>
        </div>
      </div>
      <div className="h-px bg-border" />
      <div className="flex flex-col gap-2">
        {DISCOUNT_BENEFITS.map((benefit) => (
          <div key={benefit} className="flex items-start gap-2.5">
            <Icon
              icon={CheckmarkCircle02Icon}
              size={18}
              strokeWidth={1.8}
              className="mt-px shrink-0 text-emerald-600"
            />
            <span className="text-[13px] leading-[1.5] text-foreground/90">{benefit}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <Button onClick={onAccept} className="h-11 w-full text-[13.5px] font-semibold">
          Claim my discount
        </Button>
        <Button
          variant="ghost"
          onClick={onDecline}
          className="h-9 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          I still want to cancel
        </Button>
      </div>
    </div>
  );
}

function LoadingStep({ frozen }: { frozen: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <LottieStage src="/lottie/hourglass-blue.json" w={120} h={120} />
      <div className="flex flex-col gap-1.5 text-center">
        <StepTitle centered>Just a moment</StepTitle>
        <p className="text-[13px] text-muted-foreground">Please don't close this page</p>
      </div>
      <LoadingBar frozen={frozen} />
    </div>
  );
}

function KeptStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <DialogHero src="/images/kept-badge.png" alt="Celebration badge" />
        <StepTitle centered>Great decision!</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          Your discount is applied. Your plan stays active at {DEAL_PRICE}/year.
        </p>
      </div>
      <Button onClick={onDone} className="h-11 w-full text-[13.5px] font-semibold">
        Continue to dashboard
      </Button>
    </div>
  );
}

function GoneStep({ onDone }: { onDone: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-3 text-center">
        <DialogHero src="/images/gone-plane.png" alt="Paper plane" />
        <StepTitle centered>Sorry to see you go</StepTitle>
        <p className="text-[13px] leading-[1.6] text-muted-foreground">
          Your subscription is cancelled. You keep full access until {ACTIVE_UNTIL}, and we hope to see
          you again.
        </p>
      </div>
      <Button onClick={onDone} className="h-11 w-full text-[13.5px] font-semibold">
        Done
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

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
  const [, setDeleteFiles] = useState(false);
  const [outcome, setOutcome] = useState<"kept" | "gone">("kept");
  // Opened directly at "loading" (demo flag): freeze the loader for captures.
  const [frozenLoading, setFrozenLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const startsAtDetails = initialStep === "survey_other" || initialStep === "surveyDetails";
    setStep(startsAtDetails ? "surveyDetails" : initialStep);
    setReason(startsAtDetails ? DEFAULT_DETAIL_REASON : null);
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

  // Reasons worth a follow-up get one; the rest go straight to the offer.
  function leaveSurvey() {
    setStep(reason !== null && REASONS_WITH_DETAILS.has(reason) ? "surveyDetails" : "discount");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHELL} aria-describedby={undefined}>
        {step === "confirm" && (
          <ConfirmStep onCancel={() => setStep("before")} onPause={() => setStep("pause")} />
        )}
        {step === "pause" && (
          <PauseStep onBack={() => setStep("confirm")} onPause={() => setStep("pauseDone")} />
        )}
        {step === "pauseDone" && <PauseDoneStep onDone={close} />}
        {step === "before" && (
          <BeforeStep
            onBack={() => setStep("confirm")}
            onTry={close}
            onContinue={() => setStep("files")}
          />
        )}
        {step === "files" && (
          <FilesStep
            onBack={() => setStep("before")}
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
            onBack={() => setStep("files")}
            onSkip={() => setStep("discount")}
            onReasonChange={setReason}
            onContinue={leaveSurvey}
          />
        )}
        {step === "surveyDetails" && (
          <SurveyDetailsStep
            reason={reason ?? DEFAULT_DETAIL_REASON}
            details={reasonDetails}
            onBack={() => setStep("survey")}
            onSkip={() => setStep("discount")}
            onDetailsChange={setReasonDetails}
            onContinue={() => setStep("discount")}
          />
        )}
        {step === "discount" && (
          <DiscountStep
            onBack={() => setStep("survey")}
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
