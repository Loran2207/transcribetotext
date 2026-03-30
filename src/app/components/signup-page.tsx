import { useState, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, Navigate } from "react-router";
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

const STRENGTH_CONFIG: Record<PasswordStrength, { barClass: string; textClass: string; width: string; label: string }> = {
  weak: { barClass: "bg-destructive", textClass: "text-destructive", width: "33%", label: "Weak" },
  medium: { barClass: "bg-[var(--strength-medium)]", textClass: "text-[var(--strength-medium)]", width: "66%", label: "Medium" },
  strong: { barClass: "bg-[var(--strength-strong)]", textClass: "text-[var(--strength-strong)]", width: "100%", label: "Strong" },
};

export function SignupPage() {
  const { signUp, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedEmail, setFailedEmail] = useState<string | null>(null);
  const submittingRef = useRef(false);

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

  // BUG 10 fix: redirect already-authenticated users away from signup
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: SignupFormValues) => {
    // Prevent double-submit (React StrictMode can cause double-mount)
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrorMessage(null);
    setFailedEmail(null);

    const { error, needsEmailConfirmation } = await signUp(data.email, data.password, data.fullName);

    if (error) {
      const isAlreadyExists = error.message.includes('already exists');
      setErrorMessage(error.message);
      if (isAlreadyExists) {
        setFailedEmail(data.email);
      }
      setIsSubmitting(false);
      submittingRef.current = false;
      return;
    }

    if (needsEmailConfirmation) {
      navigate(`/check-email?email=${encodeURIComponent(data.email)}`);
      return;
    }

    toast.success("Account created! Welcome aboard.");
    navigate("/");
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = () => {
    toast("This feature is coming soon");
  };

  const isFormDisabled = isSubmitting || isGoogleLoading;

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
          <div className="text-sm text-destructive">
            <span>{errorMessage}</span>
            {failedEmail && (
              <>
                {" "}
                <Link
                  to="/login"
                  state={{ prefillEmail: failedEmail }}
                  className="text-primary font-medium hover:underline"
                >
                  Log in instead &rarr;
                </Link>
              </>
            )}
          </div>
        )}

        {/* Google Sign In */}
        <motion.div {...animProps(0.12)}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-full"
            onClick={handleGoogleSignIn}
            disabled={isFormDisabled}
          >
            {isGoogleLoading ? (
              <>
                <Icon icon={Loading01Icon} size={16} className="animate-spin" />
                Redirecting...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" className="shrink-0">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"/>
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
                </svg>
                Continue with Google
              </>
            )}
          </Button>
        </motion.div>

        {/* Microsoft Sign In */}
        <motion.div {...animProps(0.14)}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-full opacity-60 cursor-not-allowed"
            onClick={handleMicrosoftSignIn}
          >
            <svg width="18" height="18" viewBox="0 0 21 21" className="shrink-0">
              <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
              <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
            </svg>
            Continue with Microsoft
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div className="flex items-center gap-3" {...animProps(0.16)}>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        {/* Full Name */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.22)}>
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            className={errors.fullName ? "border-destructive" : ""}
            disabled={isFormDisabled}
            aria-invalid={!!errors.fullName}
            {...register("fullName", { required: "Name is required" })}
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">{errors.fullName.message}</p>
          )}
        </motion.div>

        {/* Email */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.30)}>
          <Label htmlFor="signupEmail">Email</Label>
          <Input
            id="signupEmail"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={errors.email ? "border-destructive" : ""}
            disabled={isFormDisabled}
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

        {/* Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.38)}>
          <Label htmlFor="signupPassword">Password</Label>
          <div className="relative">
            <Input
              id="signupPassword"
              type={showPassword ? "text" : "password"}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              disabled={isFormDisabled}
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

          {/* Password strength bar */}
          {strength && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="h-1 w-full rounded-full bg-border">
                <motion.div
                  className={`h-1 rounded-full ${STRENGTH_CONFIG[strength].barClass}`}
                  initial={{ width: 0 }}
                  animate={{ width: STRENGTH_CONFIG[strength].width }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              </div>
              <span className={`text-xs ${STRENGTH_CONFIG[strength].textClass}`}>
                {STRENGTH_CONFIG[strength].label}
              </span>
            </div>
          )}
        </motion.div>

        {/* Confirm Password */}
        <motion.div className="flex flex-col gap-2" {...animProps(0.46)}>
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
              disabled={isFormDisabled}
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
        <motion.div {...animProps(0.54)}>
          <Button
            type="submit"
            className="w-full rounded-full"
            size="lg"
            disabled={isFormDisabled}
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
          {...animProps(0.62)}
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
