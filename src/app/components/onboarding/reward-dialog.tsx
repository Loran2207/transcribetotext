import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Copy01Icon, GiftIcon } from "@hugeicons/core-free-icons";
import { Icon } from "../ui/icon";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* The moment the sixth lesson ends: confetti has just fallen, and this
   dialog hands over the reward and points straight at the checkout with the
   code already applied. "Later" keeps the reward card in the panel. */
export function RewardDialog() {
  const ob = useOnboarding();
  const navigate = useNavigate();
  const open = ob.celebration === "all";
  const copy = async () => { try { await navigator.clipboard.writeText(REWARD.code); toast.success("Code copied"); } catch { toast(REWARD.code); } };
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) ob.dismissCelebration(); }}>
      <DialogContent data-onboarding-reward-dialog="" className="gap-0 p-0 sm:max-w-[420px]">
        <div className="flex flex-col items-center px-6 pt-8 pb-6 text-center">
          <span className="flex size-[64px] items-center justify-center rounded-full bg-primary/10 text-primary"><Icon icon={GiftIcon} size={30} /></span>
          <DialogTitle className="mt-4 text-[22px] font-bold tracking-[-0.3px] text-foreground">You finished the guide</DialogTitle>
          <DialogDescription className="mt-2 text-[14px] leading-[20px] text-foreground/80">{REWARD.body}</DialogDescription>
          <button type="button" onClick={copy} className="mt-5 flex w-full items-center justify-between gap-2 rounded-[10px] border border-dashed border-primary/50 bg-primary/[0.05] px-[14px] py-[10px] text-left transition-colors hover:bg-primary/[0.09]">
            <span className="font-mono text-[15px] font-semibold tracking-wide text-primary">{REWARD.code}</span>
            <span className="flex items-center gap-1 text-[12px] font-medium text-primary"><Icon icon={Copy01Icon} size={13} />Copy</span>
          </button>
          <Button data-onboarding-claim="" onClick={() => { ob.claimReward(); navigate(`/checkout?code=${REWARD.code}`); }} className="mt-3 h-11 w-full text-[14px] font-semibold">Claim my free month</Button>
          <button type="button" onClick={ob.dismissCelebration} className="mt-3 text-[13px] font-medium text-muted-foreground hover:text-foreground">Later</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
