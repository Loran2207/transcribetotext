import {
  AiBrain01Icon,
  FlashIcon,
  Infinity01Icon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent } from "./ui/dialog";
import { DialogHero } from "./dialog-hero";
import { Icon, type IconSvgElement } from "./ui/icon";
import {
  SINGLE_DIALOG_SHELL,
  STEP_BUTTON,
  StepActions,
  StepBody,
  StepChrome,
  StepLead,
  StepTitle,
} from "./dialog-step";
import { router } from "../routes";

// Shared free-plan upgrade gate. "limit" blocks the primary Transcribe action
// for free users; "done" celebrates a finished job that hit the free limit.
// Same shell, title weight and full-width action as the cancel flow, but the
// height hugs the content: this dialog stands alone, so there is no next step
// for it to jump against.

export type UpgradeGateVariant = "limit" | "done";

interface BenefitChip {
  icon: IconSvgElement;
  label: string;
}

const BENEFIT_CHIPS: BenefitChip[] = [
  { icon: Infinity01Icon, label: "No limits, ever" },
  { icon: FlashIcon, label: "Priority processing" },
  { icon: AiBrain01Icon, label: "Smart summaries" },
  { icon: TranslateIcon, label: "Speaker recognition" },
];

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: UpgradeGateVariant;
}

export function UpgradeGateModal({ open, onOpenChange, variant }: UpgradeGateModalProps) {
  const title =
    variant === "done" ? "Done! You've hit the free limit" : "You've reached the free limit";

  function handleUpgrade() {
    onOpenChange(false);
    // The shared instance is mounted by TranscriptionModalsProvider, outside
    // RouterProvider, so navigation uses the router singleton (the same
    // pattern transcription-modals.tsx uses for its own navigation).
    void router.navigate("/checkout");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SINGLE_DIALOG_SHELL} aria-describedby={undefined}>
        <StepChrome />
        <StepBody>
          <DialogHero src="/images/gate-crown.png" alt="Premium crown" />
          <StepTitle>{title}</StepTitle>
          <StepLead>Upgrade to unlock full transcripts, summaries and every AI feature.</StepLead>
          <div className="grid grid-cols-2 gap-2.5">
            {BENEFIT_CHIPS.map((chip) => (
              <div
                key={chip.label}
                className="flex items-center gap-2.5 rounded-2xl border border-border p-3.5 text-left"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-primary/10">
                  <Icon icon={chip.icon} size={16} strokeWidth={1.8} className="text-primary" />
                </span>
                <span className="text-[13px] font-medium leading-snug">{chip.label}</span>
              </div>
            ))}
          </div>
        </StepBody>
        <StepActions>
          <Button onClick={handleUpgrade} className={STEP_BUTTON}>
            See plans & upgrade
          </Button>
        </StepActions>
      </DialogContent>
    </Dialog>
  );
}
