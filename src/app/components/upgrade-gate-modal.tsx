import {
  AiBrain01Icon,
  CrownIcon,
  FlashIcon,
  Infinity01Icon,
  TranslateIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle } from "./ui/dialog";
import { Icon, type IconSvgElement } from "./ui/icon";
import { router } from "../routes";

// Shared free-plan upgrade gate. "limit" blocks the primary Transcribe action
// for free users; "done" celebrates a finished job that hit the free limit.

export type UpgradeGateVariant = "limit" | "done";

interface BenefitChip {
  icon: IconSvgElement;
  label: string;
}

const BENEFIT_CHIPS: BenefitChip[] = [
  { icon: Infinity01Icon, label: "No limits, ever" },
  { icon: FlashIcon, label: "Blazing-fast processing" },
  { icon: AiBrain01Icon, label: "Smart summaries & action points" },
  { icon: TranslateIcon, label: "Speaker recognition & translation" },
];

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variant: UpgradeGateVariant;
}

export function UpgradeGateModal({ open, onOpenChange, variant }: UpgradeGateModalProps) {
  const title =
    variant === "done"
      ? "Done! But you've reached the free limit"
      : "You've reached the free limit";

  function handleUpgrade() {
    onOpenChange(false);
    // The shared instance is mounted by TranscriptionModalsProvider, outside
    // RouterProvider, so navigation uses the router singleton (the same
    // pattern transcription-modals.tsx uses for its own navigation).
    void router.navigate("/checkout");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="z-[240] rounded-2xl p-6 sm:max-w-[440px]"
        aria-describedby={undefined}
      >
        <div className="flex flex-col gap-4">
          <DialogTitle className="text-left text-[19px] font-semibold tracking-tight">
            {title}
          </DialogTitle>
          <div className="rounded-2xl bg-primary/5 p-3.5 text-left text-[13.5px] font-medium">
            Want full transcripts and powerful AI features?
          </div>
          <div className="flex flex-col items-center gap-2 pt-1">
            <Icon icon={CrownIcon} size={44} strokeWidth={1.6} className="text-primary" />
            <p className="text-[18px] font-semibold">Unlock full access</p>
          </div>
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
          <p className="text-left text-[13.5px] font-semibold text-primary">
            Upgrade now and keep transcribing!
          </p>
          <div className="flex justify-end pt-1">
            <Button onClick={handleUpgrade} className="h-10 px-5 text-[13.5px] font-semibold">
              See plans & upgrade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
