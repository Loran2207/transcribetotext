import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { DialogHero } from "../dialog-hero";
import { GUIDE_PERSON, REWARD } from "./guides";
import { useOnboarding } from "./onboarding-context";

/* The moment the first steps are done: confetti has just fallen, and this
   dialog says the bonus is on (client call 05.10: priority processing, not a
   subscription; no code, no checkout). The open blue box stays as the bonus
   visual. Nothing is left to decide, so any way out of the dialog keeps the
   bonus on, and Plan Management shows it from then on. */
export const GIFT_HERO = "/images/discount-gift.png";

export function RewardDialog() {
  const ob = useOnboarding();
  const open = ob.celebration === "all";
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) ob.claimReward(); }}>
      {/* on touch the base dialog's 16px close mark grows to a 36px target */}
      <DialogContent data-onboarding-reward-dialog="" className="gap-0 p-0 sm:max-w-[420px] pointer-coarse:[&>button:last-child]:top-2 pointer-coarse:[&>button:last-child]:right-2 pointer-coarse:[&>button:last-child]:flex pointer-coarse:[&>button:last-child]:size-9 pointer-coarse:[&>button:last-child]:items-center pointer-coarse:[&>button:last-child]:justify-center">
        <div className="flex flex-col items-center px-6 pt-7 pb-6 text-center">
          <div className="relative">
            <DialogHero src={GIFT_HERO} alt="" />
            <img src={GUIDE_PERSON.avatar} alt="" aria-hidden className="absolute -right-[6px] bottom-[6px] size-[44px] select-none rounded-full object-cover ring-[3px] ring-card" />
          </div>
          <DialogTitle className="mt-2 text-[22px] font-bold tracking-[-0.3px] text-foreground">{REWARD.title}</DialogTitle>
          <DialogDescription className="mt-2 text-[14px] leading-[20px] text-muted-foreground">{GUIDE_PERSON.name}, {GUIDE_PERSON.title}: "First steps done. {REWARD.body}"</DialogDescription>
          <Button data-onboarding-claim="" onClick={ob.claimReward} className="mt-5 h-11 w-full text-[14px] font-semibold">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
