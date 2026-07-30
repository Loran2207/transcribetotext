import { useEffect, useState, type ReactNode } from "react";
import {
  AiBrain01Icon,
  Alert02Icon,
  Calendar03Icon,
  CheckmarkCircle02Icon,
  Download01Icon,
  File01Icon,
  TranslateIcon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Switch } from "./ui/switch";
import { Textarea } from "./ui/textarea";
import { Icon, type IconSvgElement } from "./ui/icon";
import { LottieStage } from "./checkout-loader/lottie-stage";
import { ACTIVE_UNTIL, PAUSED_UNTIL } from "./billing-dates";
import { DialogHero } from "./dialog-hero";
import {
  STEP_BUTTON,
  STEP_DIALOG_SHELL,
  StepActions,
  StepBody,
  StepChrome,
  StepLead,
  StepTitle,
} from "./dialog-step";

// Cancel-subscription flow, opened from Settings > Plan management:
// confirm -> (pause -> pauseDone) or
// (before -> files -> survey -> [surveyDetails] -> discount -> loading -> kept | gone).
//
// Every step is built from the same three rows (chrome, body, actions) inside a
// dialog of one fixed size, so nothing about the window changes as the flow
// advances: the title sits in the same place and the actions never move. Holding
// one size only works if no step is nearly empty, so the thin steps carry the
// facts a user actually wants there (what each choice costs, what happens next)
// instead of padding.

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

// The retention offer, same terms as the approved reference: three months for
// the price of a fortnight, against the regular quarterly price.
const DEAL_TERM = "3-month access";
const DEAL_TOTAL = "$14.99";
const DEAL_REGULAR = "$54.99";
const DEAL_PER_DAY = "$0.16";
const DEAL_SAVING = "Save 73%";

const PAUSE_BENEFITS = [
  "Access every transcript processed during your active subscription",
  "Share your transcriptions with others",
  "Localize and repurpose completed documents for other languages or markets",
  "Stay in control of your content, even while you take a break",
];

const DISCOUNT_BENEFITS = [
  "Full access to all features",
  "No limits on exports",
  "Cancel anytime during the 3 months",
];

// One record shown as the thing at stake, mirroring the reference dialog: its
// settings stay live here, so the chevrons and the toggle are real controls
// rather than decoration.
const RECORD_PREVIEW = {
  time: "06:00 PM - 07:00 PM",
  name: "Client Meeting Notes",
};

const RECORD_LANGUAGES = ["Russian", "English", "Spanish", "German", "French", "Japanese"];
const RECORD_SPEAKERS = ["2", "3", "4", "5", "6"];

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

// What cancelling actually destroys, counted. The numbers are the argument on
// this step, so they get the weight instead of a list of file names.
const DELETE_STATS: { icon: IconSvgElement; count: string; label: string }[] = [
  { icon: File01Icon, count: "17", label: "transcribed files" },
  { icon: AiBrain01Icon, count: "4", label: "AI-generated summaries" },
];

const SURVEY_REASONS = [
  "I don't use it",
  "It's too expensive",
  "I'm missing features I need",
  "Technical issues",
  "Quality is low",
  "Other",
];

// "Other" opens a field in place, the way the reference does it. A missing
// feature deserves a screen of its own, so that one gets a follow-up step.
const REASONS_WITH_INLINE_DETAILS = new Set(["Other"]);
const REASONS_WITH_FOLLOW_UP = new Set(["I'm missing features I need"]);
const DEFAULT_DETAIL_REASON = "I'm missing features I need";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

function InfoBanner({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-center text-[13px] leading-[1.6]">
      {children}
    </div>
  );
}

function BenefitRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        icon={CheckmarkCircle02Icon}
        size={18}
        strokeWidth={1.8}
        className="mt-px shrink-0 text-emerald-600"
      />
      <span className="text-[13px] leading-[1.55] text-foreground/90">{children}</span>
    </div>
  );
}

// The receipt a terminal step owes the user: what is true now, in plain rows.
function FactsCard({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border text-left">
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={`flex items-center justify-between gap-4 px-4 py-2.5 ${
            i > 0 ? "border-t border-border" : ""
          }`}
        >
          <span className="text-[12.5px] text-muted-foreground">{row.label}</span>
          <span className="text-right text-[12.5px] font-semibold">{row.value}</span>
        </div>
      ))}
    </div>
  );
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
    <div className="mx-auto h-[3px] w-full max-w-[220px] overflow-hidden rounded-full bg-primary/10">
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
    <>
      <StepChrome />
      <StepBody>
        <StepTitle>Are you sure?</StepTitle>
        <InfoBanner>
          Your subscription stays active until{" "}
          <span className="font-semibold text-primary">{ACTIVE_UNTIL}</span>. If you cancel, your
          account will be deactivated on that day.
        </InfoBanner>
        <StepLead>
          To retain access to your transcripts, tools and progress, consider pausing instead: you can
          return after a break and pick up right where you left off.
        </StepLead>
      </StepBody>
      <StepActions>
        <Button variant="pill-outline" onClick={onCancel} className={STEP_BUTTON}>
          Cancel subscription
        </Button>
        <Button onClick={onPause} className={STEP_BUTTON}>
          Pause subscription
        </Button>
      </StepActions>
    </>
  );
}

function PauseStep({ onBack, onPause }: { onBack: () => void; onPause: () => void }) {
  return (
    <>
      <StepChrome onBack={onBack} />
      <StepBody>
        <DialogHero src="/images/paused-symbol.png" alt="Paused" />
        <StepTitle>Pause subscription</StepTitle>
        <StepLead>
          Take the time you need. Pause your subscription and come back whenever you're ready.
        </StepLead>
        <div className="flex flex-col gap-2.5">
          {PAUSE_BENEFITS.map((benefit) => (
            <BenefitRow key={benefit}>{benefit}</BenefitRow>
          ))}
        </div>
      </StepBody>
      <StepActions>
        <Button onClick={onPause} className={STEP_BUTTON}>
          Pause subscription
        </Button>
      </StepActions>
    </>
  );
}

function PauseDoneStep({ onDone }: { onDone: () => void }) {
  return (
    <>
      <StepChrome />
      <StepBody>
        <DialogHero src="/images/paused-symbol.png" alt="Paused" />
        <StepTitle>Subscription paused</StepTitle>
        <StepLead>Nothing is lost. Everything waits for you exactly as you left it.</StepLead>
        <FactsCard
          rows={[
            { label: "Paused until", value: PAUSED_UNTIL },
            { label: "Your transcripts", value: "Stay available" },
            { label: "Resume", value: "Any time from Plan management" },
          ]}
        />
      </StepBody>
      <StepActions>
        <Button onClick={onDone} className={STEP_BUTTON}>
          Back to dashboard
        </Button>
      </StepActions>
    </>
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
    <>
      <StepChrome onBack={onBack} onSkip={onContinue} />
      <StepBody>
        <DialogHero src="/images/gate-crown.png" alt="Premium crown" />
        <StepTitle>Before you cancel</StepTitle>
        <StepLead>You haven't tried the biggest time-savers yet</StepLead>
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
      </StepBody>
      <StepActions>
        <Button variant="pill-outline" onClick={onContinue} className={STEP_BUTTON}>
          Continue cancelling
        </Button>
        <Button onClick={onTry} className={STEP_BUTTON}>
          Try these features
        </Button>
      </StepActions>
    </>
  );
}

// A meta row that keeps the reference's chevron and actually opens: the value is
// a real select, so the affordance is not a promise the screen cannot keep.
function RecordMetaRow({
  icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: IconSvgElement;
  label: string;
  value: string;
  options: string[];
  onChange: (next: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon icon={icon} size={14} strokeWidth={1.8} className="shrink-0 text-muted-foreground" />
      <span className="text-[12.5px] text-muted-foreground">{label}:</span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          aria-label={label}
          className="h-auto w-auto gap-1 border-0 bg-transparent p-0 text-[12.5px] font-medium text-foreground/85 shadow-none focus-visible:ring-0 [&>svg]:size-3.5 [&>svg]:opacity-70"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option} className="text-[13px]">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RecordPreview() {
  const [language, setLanguage] = useState(RECORD_LANGUAGES[0]);
  const [speakers, setSpeakers] = useState(RECORD_SPEAKERS[2]);
  const [managed, setManaged] = useState(false);
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/5 p-3.5 text-left">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-card">
          <Icon icon={Calendar03Icon} size={14} strokeWidth={1.8} className="text-primary" />
        </span>
        <span className="min-w-0 flex-1 text-[14px] font-semibold">{RECORD_PREVIEW.name}</span>
        <span className="shrink-0 text-[12px] text-muted-foreground">{RECORD_PREVIEW.time}</span>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1">
        <RecordMetaRow
          icon={TranslateIcon}
          label="Language"
          value={language}
          options={RECORD_LANGUAGES}
          onChange={setLanguage}
        />
        <RecordMetaRow
          icon={UserMultiple02Icon}
          label="Speakers"
          value={speakers}
          options={RECORD_SPEAKERS}
          onChange={setSpeakers}
        />
      </div>
      <div className="mt-2.5 flex items-center justify-between border-t border-primary/10 pt-2.5">
        <span className="text-[12.5px] font-semibold text-primary">Manage record</span>
        <Switch checked={managed} onCheckedChange={setManaged} aria-label="Manage record" />
      </div>
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
    <>
      <StepChrome onBack={onBack} onSkip={onKeep} />
      <StepBody>
        <DialogHero src="/images/files-folder.png" alt="Folder with documents" tone="danger" />
        <StepTitle>Delete all your files?</StepTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {DELETE_STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-2.5 rounded-2xl border border-border p-3 text-left"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                <Icon icon={stat.icon} size={16} strokeWidth={1.8} className="text-primary" />
              </span>
              <span className="min-w-0 text-[12.5px] leading-[1.35]">
                <span className="font-semibold">{stat.count}</span> {stat.label}
              </span>
            </div>
          ))}
        </div>
        <RecordPreview />
        <div className="flex items-center justify-center gap-2">
          <Icon icon={Alert02Icon} size={15} strokeWidth={1.9} className="shrink-0 text-destructive" />
          <span className="text-[12.5px] text-muted-foreground">
            Deleted permanently. This cannot be undone.
          </span>
        </div>
      </StepBody>
      <StepActions>
        <Button variant="destructive-outline" onClick={onDelete} className={STEP_BUTTON}>
          Delete everything
        </Button>
        <Button onClick={onKeep} className={STEP_BUTTON}>
          Exit without deleting
        </Button>
      </StepActions>
    </>
  );
}

function SurveyStep({
  reason,
  details,
  onBack,
  onSkip,
  onReasonChange,
  onDetailsChange,
  onContinue,
}: {
  reason: string | null;
  details: string;
  onBack: () => void;
  onSkip: () => void;
  onReasonChange: (reason: string) => void;
  onDetailsChange: (value: string) => void;
  onContinue: () => void;
}) {
  const showField = reason !== null && REASONS_WITH_INLINE_DETAILS.has(reason);
  return (
    <>
      <StepChrome onBack={onBack} onSkip={onSkip} />
      <StepBody>
        <StepTitle>We're sorry to see you go</StepTitle>
        <StepLead>Why do you want to cancel?</StepLead>
        <div className="flex flex-col gap-2">
          {SURVEY_REASONS.map((option) => {
            const selected = reason === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onReasonChange(option)}
                className={`flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-colors ${
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
                <span className={`text-[13.5px] ${selected ? "font-semibold" : "font-medium"}`}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
        {showField && (
          <Textarea
            value={details}
            onChange={(e) => onDetailsChange(e.target.value)}
            placeholder="Tell us what made you leave and we will pass it to the team"
            className="min-h-20 rounded-2xl text-[13px]"
          />
        )}
      </StepBody>
      <StepActions>
        <Button onClick={onContinue} disabled={reason === null} className={STEP_BUTTON}>
          Continue
        </Button>
      </StepActions>
    </>
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
    <>
      <StepChrome onBack={onBack} onSkip={onSkip} />
      <StepBody>
        <StepTitle>{reason}</StepTitle>
        <StepLead>
          Tell us what you expected from the app and we will pass it straight to the team.
        </StepLead>
        <Textarea
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder="Please enter your message here"
          className="min-h-40 rounded-2xl text-[13px]"
        />
      </StepBody>
      <StepActions>
        <Button onClick={onContinue} className={STEP_BUTTON}>
          Continue
        </Button>
      </StepActions>
    </>
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
    <>
      <StepChrome onBack={onBack} />
      <StepBody>
        <DialogHero src="/images/discount-gift.png" alt="Gift box" />
        <StepTitle>Best price before you go</StepTitle>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <span className="text-[13px] text-muted-foreground">
            {DEAL_TERM}, was <span className="line-through">{DEAL_REGULAR}</span>
          </span>
          <span className="text-[44px] font-bold leading-none tracking-tight">{DEAL_TOTAL}</span>
          <span className="text-[12.5px] text-muted-foreground">
            total, just {DEAL_PER_DAY} a day
          </span>
          <span className="mt-1.5 rounded-full bg-destructive px-3 py-1 text-[12px] font-semibold text-destructive-foreground">
            {DEAL_SAVING}
          </span>
        </div>
        <div className="h-px bg-border" />
        <div className="flex flex-col gap-2">
          {DISCOUNT_BENEFITS.map((benefit) => (
            <BenefitRow key={benefit}>{benefit}</BenefitRow>
          ))}
        </div>
      </StepBody>
      <StepActions>
        <Button variant="pill-outline" onClick={onDecline} className={STEP_BUTTON}>
          Continue to cancel
        </Button>
        <Button onClick={onAccept} className={STEP_BUTTON}>
          Get 3 months for {DEAL_TOTAL}
        </Button>
      </StepActions>
    </>
  );
}

function LoadingStep({ frozen }: { frozen: boolean }) {
  return (
    <>
      <StepChrome />
      <StepBody centered>
        <div className="mx-auto">
          <LottieStage src="/lottie/hourglass-blue.json" w={120} h={120} />
        </div>
        <StepTitle>Just a moment</StepTitle>
        <StepLead>Please don't close this page</StepLead>
        <LoadingBar frozen={frozen} />
      </StepBody>
      <StepActions>
        <Button disabled className={STEP_BUTTON}>
          Finishing up
        </Button>
      </StepActions>
    </>
  );
}

function KeptStep({ onDone }: { onDone: () => void }) {
  return (
    <>
      <StepChrome />
      <StepBody>
        <DialogHero src="/images/kept-badge.png" alt="Celebration badge" />
        <StepTitle>Great decision!</StepTitle>
        <StepLead>Your discount is applied and every file stayed where it was.</StepLead>
        <FactsCard
          rows={[
            { label: "Your plan", value: DEAL_TERM },
            { label: "You pay", value: `${DEAL_TOTAL} total` },
            { label: "Cancel", value: "Any time during the 3 months" },
          ]}
        />
      </StepBody>
      <StepActions>
        <Button onClick={onDone} className={STEP_BUTTON}>
          Continue to dashboard
        </Button>
      </StepActions>
    </>
  );
}

function GoneStep({ onDone }: { onDone: () => void }) {
  return (
    <>
      <StepChrome />
      <StepBody>
        <DialogHero src="/images/gone-plane.png" alt="Paper plane" />
        <StepTitle>Sorry to see you go</StepTitle>
        <StepLead>Your subscription is cancelled and we hope to see you again.</StepLead>
        <FactsCard
          rows={[
            { label: "Full access until", value: ACTIVE_UNTIL },
            { label: "Your transcripts", value: "Downloadable until then" },
            { label: "Come back", value: "Reactivate any time" },
          ]}
        />
      </StepBody>
      <StepActions>
        <Button onClick={onDone} className={STEP_BUTTON}>
          Done
        </Button>
      </StepActions>
    </>
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
    // Demo captures open the survey on its answered state, the way the
    // reference shows it, and the follow-up on the reason that has one.
    const startsAtDetails = initialStep === "survey_other" || initialStep === "surveyDetails";
    setStep(startsAtDetails ? "surveyDetails" : initialStep);
    setReason(startsAtDetails ? DEFAULT_DETAIL_REASON : initialStep === "survey" ? "Other" : null);
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

  // A missing feature earns a screen of its own; everything else, including a
  // filled-in "Other", goes straight to the offer.
  function leaveSurvey() {
    setStep(reason !== null && REASONS_WITH_FOLLOW_UP.has(reason) ? "surveyDetails" : "discount");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={STEP_DIALOG_SHELL} aria-describedby={undefined}>
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
            details={reasonDetails}
            onBack={() => setStep("files")}
            onSkip={() => setStep("discount")}
            onReasonChange={setReason}
            onDetailsChange={setReasonDetails}
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
