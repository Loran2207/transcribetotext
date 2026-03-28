import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Mail02Icon, Loading01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { AuthLayout } from "./auth-layout";
import { supabase } from "@/lib/supabase";

export function EmailConfirmationPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const prefersReducedMotion = useReducedMotion();
  const [isResending, setIsResending] = useState(false);

  const handleResend = async () => {
    if (!email) return;
    setIsResending(true);
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setIsResending(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Confirmation email resent!");
    }
  };

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: {
            type: "spring" as const,
            stiffness: 400,
            damping: 28,
            delay,
          },
        };

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center gap-6">
        {/* Animated email icon */}
        <motion.div
          {...animProps(0)}
          className="w-16 h-16 rounded-full flex items-center justify-center bg-primary text-primary-foreground"
        >
          <motion.div
            animate={prefersReducedMotion ? {} : { y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Icon icon={Mail02Icon} size={28} />
          </motion.div>
        </motion.div>

        <motion.div {...animProps(0.1)}>
          <h1 className="text-2xl font-semibold text-foreground">
            Check your email
          </h1>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground -mt-3"
          {...animProps(0.18)}
        >
          We sent a confirmation link to{" "}
          {email ? (
            <span className="font-medium text-foreground">{email}</span>
          ) : (
            "your email"
          )}
        </motion.p>

        <motion.div
          className="w-full flex flex-col gap-3"
          {...animProps(0.26)}
        >
          <Button
            onClick={handleResend}
            className="w-full rounded-full"
            size="lg"
            variant="outline"
            disabled={isResending || !email}
          >
            {isResending ? (
              <>
                <Icon
                  icon={Loading01Icon}
                  size={16}
                  className="animate-spin"
                />
                Resending...
              </>
            ) : (
              "Resend email"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground"
          {...animProps(0.34)}
        >
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to login &rarr;
          </Link>
        </motion.p>
      </div>
    </AuthLayout>
  );
}
