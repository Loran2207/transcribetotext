import {
  AiBrain01Icon,
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
// Same dialog shell and spacing rhythm as the cancel-subscription flow: aligned
// close button, left-aligned title, one clear full-width call to action.

export type UpgradeGateVariant = "limit" | "done";

const SHELL =
  "rounded-2xl p-6 sm:max-w-[440px] [&>button]:right-5 [&>button]:top-5 [&>button]:opacity-60";

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
      <DialogContent className={SHELL} aria-describedby={undefined}>
        <div className="flex flex-col gap-4">
          <div className="relative flex size-16 items-center justify-center">
            <div className="absolute inset-2 rounded-full bg-primary/10 blur-xl" />
            <img
              src="/images/gate-crown.png"
              alt="Premium crown"
              className="relative size-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="pr-8 text-left text-[18px] font-semibold tracking-tight">
              {title}
            </DialogTitle>
            <p className="text-[13px] leading-[1.6] text-muted-foreground">
              Upgrade to unlock full transcripts, summaries and every AI feature.
            </p>
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
          <Button
            onClick={handleUpgrade}
            className="h-11 w-full text-[13.5px] font-semibold"
          >
            See plans & upgrade
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
