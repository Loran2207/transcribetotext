import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { EyeIcon, ViewOffIcon, Loading01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthLayout } from "./auth-layout";
import { supabase } from "@/lib/supabase";

interface ResetPasswordFormValues {
  password: string;
  confirmPassword: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ mode: "onBlur" });

  const passwordValue = watch("password", "");

  // Supabase auto-handles the recovery token from the URL hash.
  // We just need to wait for the session to be established.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionReady(true);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setSessionReady(true);
      }
      // Also handle SIGNED_IN for cases where auth-callback already
      // processed the recovery token and redirected here with a session.
      if (event === "SIGNED_IN" && session) {
        setSessionReady(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const onSubmit = async (data: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.updateUser({
      password: data.password,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setIsSuccess(true);
    setTimeout(() => navigate("/login"), 2000);
  };

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };

  // Success state
  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div
            {...animProps(0)}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-[var(--strength-strong)] text-primary-foreground"
          >
            <Icon icon={Tick01Icon} size={28} />
          </motion.div>

          <motion.div {...animProps(0.1)}>
            <h1 className="text-2xl font-semibold text-foreground">
              Password updated
            </h1>
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground -mt-3"
            {...animProps(0.18)}
          >
            Redirecting to login...
          </motion.p>
        </div>
      </AuthLayout>
    );
  }

  // No session — invalid or expired link
  if (!sessionReady) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center gap-6">
          <motion.div {...animProps(0)}>
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          </motion.div>

          <motion.p
            className="text-sm text-muted-foreground"
            {...animProps(0.1)}
          >
            Verifying your reset link...
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground"
            {...animProps(0.2)}
          >
            If this takes too long, your link may have expired.{" "}
            <Link
              to="/forgot-password"
              className="text-primary font-medium hover:underline"
            >
              Request a new one &rarr;
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
            Set a new password
          </h1>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground -mt-3"
          {...animProps(0.08)}
        >
          Choose a strong password for your account
        </motion.p>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {/* New Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.16)}>
          <Label htmlFor="newPassword">New password</Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              disabled={isSubmitting}
              aria-invalid={!!errors.password}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon icon={showPassword ? ViewOffIcon : EyeIcon} size={16} />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.24)}>
          <Label htmlFor="confirmNewPassword">Confirm new password</Label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
              disabled={isSubmitting}
              aria-invalid={!!errors.confirmPassword}
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === passwordValue || "Passwords don't match",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <Icon icon={showConfirmPassword ? ViewOffIcon : EyeIcon} size={16} />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div {...animProps(0.32)}>
          <Button
            type="submit"
            className="w-full rounded-[12px]"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon icon={Loading01Icon} size={16} className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update password"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-center text-muted-foreground"
          {...animProps(0.4)}
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
