import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import { useAuth } from "./auth-context";
import { AccountLockedPage, readDemoLock } from "./account-locked-page";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  /* a locked account signs in as usual and meets the locked page instead of
     the app, on every protected address; the demo flag stands in for the
     backend's verdict and is re-read when a demo step writes it */
  const [locked, setLocked] = useState(readDemoLock);
  useEffect(() => {
    const reread = () => setLocked(readDemoLock());
    window.addEventListener("storage", reread);
    window.addEventListener("ttt-banner-hidden", reread);
    return () => {
      window.removeEventListener("storage", reread);
      window.removeEventListener("ttt-banner-hidden", reread);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (locked) {
    return <AccountLockedPage />;
  }

  return <>{children}</>;
}
