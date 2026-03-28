import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { EyeIcon, ViewOffIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthLayout } from "./auth-layout";
import { useAuth } from "./auth-context";

interface SignupFormValues {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

type PasswordStrength = "weak" | "medium" | "strong";

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 6) return "weak";

  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasDigitOrSpecial = /[\d\W]/.test(password);

  if (password.length >= 10 && hasMixedCase && hasDigitOrSpecial) return "strong";
  if (password.length >= 6 && (hasMixedCase || hasDigitOrSpecial)) return "medium";

  return "weak";
}

const STRENGTH_CONFIG: Record<PasswordStrength, { color: string; width: string; label: string }> = {
  weak: { color: "var(--destructive)", width: "33%", label: "Weak" },
  medium: { color: "#eab308", width: "66%", label: "Medium" },
  strong: { color: "#22c55e", width: "100%", label: "Strong" },
};

export function SignupPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupFormValues>({ mode: "onBlur" });

  const passwordValue = watch("password", "");

  const strength = useMemo(
    () => (passwordValue ? getPasswordStrength(passwordValue) : null),
    [passwordValue],
  );

  const onSubmit = async (data: SignupFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Account created! Check your email.");
    navigate("/login");
  };

  const animProps = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 16 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { type: "spring" as const, stiffness: 400, damping: 28, delay },
        };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <motion.div {...animProps(0)}>
          <h1 className="text-2xl font-semibold text-foreground">
            Create your account
          </h1>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground -mt-3"
          {...animProps(0.08)}
        >
          Start transcribing in seconds
        </motion.p>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {/* Full Name */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.16)}>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            className="rounded-full"
            {...register("fullName", { required: "Name is required" })}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.24)}>
          <Label htmlFor="signupEmail">Email</Label>
          <Input
            id="signupEmail"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="rounded-full"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email address",
              },
            })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </motion.div>

        {/* Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.32)}>
          <Label htmlFor="signupPassword">Password</Label>
          <div className="relative">
            <Input
              id="signupPassword"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className="pr-10 rounded-full"
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

          {/* Password strength bar */}
          {strength && (
            <div className="flex flex-col gap-1 mt-1">
              <div
                className="h-1 w-full rounded-full"
                style={{ background: "var(--border)" }}
              >
                <motion.div
                  className="h-1 rounded-full"
                  style={{ background: STRENGTH_CONFIG[strength].color }}
                  initial={{ width: 0 }}
                  animate={{ width: STRENGTH_CONFIG[strength].width }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>
              <span
                className="text-xs"
                style={{ color: STRENGTH_CONFIG[strength].color }}
              >
                {STRENGTH_CONFIG[strength].label}
              </span>
            </div>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.4)}>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className="pr-10 rounded-full"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === passwordValue || "Passwords do not match",
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <Icon
                icon={showConfirmPassword ? ViewOffIcon : EyeIcon}
                size={16}
              />
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-destructive">
              {errors.confirmPassword.message}
            </p>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div {...animProps(0.48)}>
          <Button
            type="submit"
            className="w-full rounded-full"
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Icon
                  icon={Loading01Icon}
                  size={16}
                  className="animate-spin"
                />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-center text-muted-foreground"
          {...animProps(0.56)}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary font-medium hover:underline"
          >
            Sign in &rarr;
          </Link>
        </motion.p>
      </form>
    </AuthLayout>
  );
}
