import { motion, useReducedMotion } from "motion/react";
import { Globe, Loading01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";

/* The desktop app cannot show Google's own sign-in inside its window: the
   provider insists on the system browser. So the window hands over, waits,
   and continues by itself once the browser comes back with the session. */
export function BrowserHandoff({ provider, onOpenAgain, onBack }: { provider: string; onOpenAgain: () => void; onBack: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <motion.div {...animProps(0)}>
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon icon={Globe} size={28} />
        </div>
      </motion.div>
      <motion.div className="flex flex-col gap-2" {...animProps(0.08)}>
        <h1 className="text-2xl font-semibold text-foreground">Continue in your browser</h1>
        <p className="text-sm text-muted-foreground">
          {provider} sign-in opened in your browser. Finish there, and this window continues on its own.
        </p>
      </motion.div>
      <motion.p className="flex items-center gap-2 text-sm text-muted-foreground" {...animProps(0.14)}>
        <Icon icon={Loading01Icon} size={16} className="animate-spin" />
        Waiting for the browser...
      </motion.p>
      <motion.div className="flex w-full flex-col items-center gap-3" {...animProps(0.2)}>
        <Button type="button" variant="pill-outline" size="lg" className="w-full" onClick={onOpenAgain}>
          Open the browser again
        </Button>
        <button type="button" onClick={onBack} className="text-sm font-medium text-primary hover:underline">
          Use email instead
        </button>
      </motion.div>
    </div>
  );
}
