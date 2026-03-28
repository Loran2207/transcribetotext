import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error: err }) => {
      if (err) {
        setError(err.message);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }
      if (session) {
        navigate("/", { replace: true });
      } else {
        // No session yet — Supabase may still be processing the hash
        // Listen for auth state change
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (newSession) {
            subscription.unsubscribe();
            navigate("/", { replace: true });
          }
        });

        // Timeout fallback
        setTimeout(() => {
          subscription.unsubscribe();
          navigate("/login", { replace: true });
        }, 5000);
      }
    });
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
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--primary)",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-sm text-muted-foreground">
          Confirming your email...
        </p>
      </div>
    </div>
  );
}
