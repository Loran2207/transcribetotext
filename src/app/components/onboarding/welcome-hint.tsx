import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { Icon } from "../ui/icon";
import { useOnboarding } from "./onboarding-context";
import { GUIDE_PERSON, SETUP, isSetupDone, stepTourId } from "./guides";

/* Three First steps happen inside the welcome recording. While one of them is
   still open, a quiet row under the title names the next one and starts its
   tour right here. It goes when those three are done, when First steps are
   done or hidden, while a tour runs, and for good once closed. The page
   decides the rest: only the owner of the welcome recording sees it. */
const IN_FILE = ["template", "edit", "speakers"];

export function WelcomeStepHint() {
  const ob = useOnboarding();
  if (ob.hidden || ob.allDone || ob.tour || ob.welcomeHintHidden) return null;
  const next = SETUP.find((x) => IN_FILE.includes(x.id) && !isSetupDone(x, (id) => ob.actions.has(id)));
  if (!next) return null;
  return (
    <div className="px-4 pt-3 lg:px-8">
      <div data-welcome-hint={next.id} className="flex items-center gap-[10px] rounded-[14px] border border-border bg-card py-[7px] pl-[10px] pr-[6px]">
        <Avatar className="size-[26px]">
          <AvatarImage src={GUIDE_PERSON.avatar} alt="" className="object-cover" />
          <AvatarFallback className="text-[11px] font-semibold">{GUIDE_PERSON.name[0]}</AvatarFallback>
        </Avatar>
        <p className="min-w-0 flex-1 truncate text-[13px] leading-[18px] text-foreground/80">
          <span className="max-sm:hidden">Try the next step here: </span>
          <span className="sm:hidden">Next: </span>
          <span className="font-semibold text-foreground">{next.title}</span>
        </p>
        <Button size="sm" data-welcome-hint-go="" onClick={() => ob.startGuide(stepTourId(next.id), { onRecord: true })} className="h-8 shrink-0 px-3 text-[12px] font-semibold pointer-coarse:h-9">
          Show me
        </Button>
        <Button variant="ghost" size="icon" data-welcome-hint-close="" aria-label="Hide this tip" onClick={ob.hideWelcomeHint} className="size-8 shrink-0 text-muted-foreground pointer-coarse:size-9">
          <Icon icon={Cancel01Icon} size={14} />
        </Button>
      </div>
    </div>
  );
}
