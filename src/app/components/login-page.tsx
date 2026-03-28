import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
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
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>();

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

        <motion.div className="flex flex-col gap-2" {...animProps(0.16)}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="rounded-full"
            {...register("email", { required: "Email is required" })}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </motion.div>

        <motion.div className="flex flex-col gap-2" {...animProps(0.24)}>
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pr-10 rounded-full"
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

        <motion.div {...animProps(0.32)}>
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </motion.div>

        <motion.p
          className="text-sm text-center text-muted-foreground"
          {...animProps(0.4)}
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
