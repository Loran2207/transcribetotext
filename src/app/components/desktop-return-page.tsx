import { Link, useSearchParams } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { CheckmarkCircle02Icon, ComputerIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Button } from "@/app/components/ui/button";
import { Icon } from "@/app/components/ui/icon";
import { AuthLayout } from "./auth-layout";

/* The page the browser lands on after Google, the confirmation email or the
   reset link, when the journey started in the desktop app. It says what just
   happened and sends the person back to the app; the web app stays one click
   away in case the deep link does nothing. */
const DONE = {
  signin: { title: "You're signed in", line: "Go back to TranscribeToText on your computer to continue." },
  email: { title: "Email confirmed", line: "Your account is ready. Go back to TranscribeToText on your computer to continue." },
  reset: { title: "Password updated", line: "Sign in with the new password in TranscribeToText on your computer." },
} as const;

export function DesktopReturnPage() {
  const [params] = useSearchParams();
  const kind = (params.get("done") as keyof typeof DONE) || "signin";
  const copy = DONE[kind] || DONE.signin;
  const prefersReducedMotion = useReducedMotion();
  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };
  const openApp = () => {
    window.location.assign("transcribetotext://auth");
    toast("Opening TranscribeToText on your computer");
  };
  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center gap-6">
        <motion.div {...animProps(0)}>
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon icon={CheckmarkCircle02Icon} size={28} />
          </div>
        </motion.div>
        <motion.div className="flex flex-col gap-2" {...animProps(0.08)}>
          <h1 className="text-2xl font-semibold text-foreground">{copy.title}</h1>
          <p className="text-sm text-muted-foreground">{copy.line}</p>
        </motion.div>
        <motion.div className="flex w-full flex-col items-center gap-3" {...animProps(0.16)}>
          <Button type="button" size="lg" className="w-full gap-2" onClick={openApp}>
            <Icon icon={ComputerIcon} size={16} />
            Open TranscribeToText
          </Button>
          <p className="text-sm text-muted-foreground">
            Nothing happened?{" "}
            <Link to="/" className="font-medium text-primary hover:underline">Continue in the web app</Link>
          </p>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
