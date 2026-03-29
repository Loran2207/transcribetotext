import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, Navigate, useLocation } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { EyeIcon, ViewOffIcon, Loading01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/app/components/ui/icon";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { AuthLayout } from "./auth-layout";
import { useAuth } from "./auth-context";

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const { signIn, signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({ mode: "onBlur" });

  // Pre-fill email from router state (e.g., from signup "Log in instead" link)
  useEffect(() => {
    const state = location.state as { prefillEmail?: string } | null;
    if (state?.prefillEmail) {
      setValue("email", state.prefillEmail);
      // Clear the state so it doesn't persist on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, setValue]);

  // BUG 10 fix: redirect already-authenticated users away from login
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await signIn(data.email, data.password);

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

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

  const handleForgotPassword = () => {
    navigate("/forgot-password");
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
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <motion.div {...animProps(0)}>
          <h1 className="text-2xl font-semibold text-foreground">Welcome back</h1>
        </motion.div>

        <motion.p
          className="text-sm text-muted-foreground -mt-4"
          {...animProps(0.08)}
        >
          Sign in to your TranscribeToText account
        </motion.p>

        {errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}

        {/* Google Sign In */}
        <motion.div {...animProps(0.12)}>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="w-full rounded-[12px]"
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

        {/* Divider */}
        <motion.div className="flex items-center gap-3" {...animProps(0.14)}>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </motion.div>

        <motion.div className="flex flex-col gap-2" {...animProps(0.22)}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className={errors.email ? "border-destructive" : ""}
            disabled={isFormDisabled}
            aria-invalid={!!errors.email}
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </motion.div>

        <motion.div className="flex flex-col gap-2" {...animProps(0.30)}>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
              disabled={isFormDisabled}
              aria-invalid={!!errors.password}
              {...register("password", { required: "Password is required" })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowPassword((prev) => !prev)}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <Icon
                icon={showPassword ? ViewOffIcon : EyeIcon}
                size={16}
              />
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </motion.div>

        <motion.div {...animProps(0.38)}>
          <Button
            type="submit"
            className="w-full rounded-[12px]"
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-center text-muted-foreground"
          {...animProps(0.46)}
        >
          No account?{" "}
          <Link
            to="/signup"
            className="text-primary font-medium hover:underline"
          >
            Create one free &rarr;
          </Link>
        </motion.p>
      </form>
    </AuthLayout>
  );
}
