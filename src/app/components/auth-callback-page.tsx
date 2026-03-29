import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Check if the URL hash indicates a password recovery flow.
    // Supabase encodes the token type in the URL fragment before processing it.
    const hashParams = new URLSearchParams(
      window.location.hash.substring(1),
    );
    const isRecovery = hashParams.get("type") === "recovery";

    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (err) {
        setError(err.message);
        const timeout = setTimeout(() => navigate("/login"), 3000);
        cleanupRef.current = () => clearTimeout(timeout);
        return;
      }
      if (session) {
        // If the session was already established and it's a recovery flow,
        // redirect to the reset password form instead of the dashboard.
        if (isRecovery) {
          navigate("/reset-password", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } else {
        // No session yet — Supabase may still be processing the hash
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event, newSession) => {
          if (event === "PASSWORD_RECOVERY") {
            // Don't go to dashboard — send to reset password form
            subscription.unsubscribe();
            navigate("/reset-password", { replace: true });
            return;
          }
          if (newSession) {
            subscription.unsubscribe();
            navigate("/", { replace: true });
          }
        });

        // Timeout fallback
        const timeout = setTimeout(() => {
          subscription.unsubscribe();
          navigate("/login", { replace: true });
        }, 5000);

        cleanupRef.current = () => {
          clearTimeout(timeout);
          subscription.unsubscribe();
        };
      }
    });

    return () => {
      cleanupRef.current?.();
    };
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">
          Confirming your email...
        </p>
      </div>
    </div>
  );
}
