import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { Loading01Icon, Mail02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthLayout } from "./auth-layout";
import { supabase } from "@/lib/supabase";

interface ForgotPasswordFormValues {
  email: string;
}

export function ForgotPasswordPage() {
  const prefersReducedMotion = useReducedMotion();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sentToEmail, setSentToEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ mode: "onBlur" });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(data.email.trim(), {
      redirectTo: window.location.origin + "/reset-password",
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSentToEmail(data.email.trim());
  };

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };

  // Success state — email sent
  if (sentToEmail) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-6">
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
              Check your inbox
            </h1>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground -mt-3"
            {...animProps(0.18)}
          >
            We sent a password reset link to{" "}
            <span className="font-medium text-foreground">{sentToEmail}</span>
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground"
            {...animProps(0.26)}
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

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <motion.div {...animProps(0)}>
          <h1 className="text-2xl font-semibold text-foreground">
            Reset your password
          </h1>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground -mt-3"
          {...animProps(0.08)}
        >
          Enter your email and we'll send you a reset link
        </motion.p>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        <motion.div className="flex flex-col gap-2" {...animProps(0.16)}>
          <Label htmlFor="resetEmail">Email</Label>
          <Input
            id="resetEmail"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={errors.email ? "border-destructive" : ""}
            disabled={isSubmitting}
            aria-invalid={!!errors.email}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Please enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </motion.div>

        <motion.div {...animProps(0.24)}>
          <Button
            type="submit"
            className="w-full rounded-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon icon={Loading01Icon} size={16} className="animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset link"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-center text-muted-foreground"
          {...animProps(0.32)}
        >
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Back to login &rarr;
          </Link>
        </motion.p>
      </form>
    </AuthLayout>
  );
}
