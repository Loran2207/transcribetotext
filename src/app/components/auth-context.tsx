import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const DEMO_EMAIL = "admin@test.com";
const DEMO_PASSWORD = "admin123";

const isProduction = typeof window !== "undefined"
  && window.location.hostname === "transcribetotext.com";

function createDemoUser(): User {
  return {
    id: "demo-admin-00000000-0000-0000-0000-000000000000",
    aud: "authenticated",
    role: "authenticated",
    email: DEMO_EMAIL,
    email_confirmed_at: new Date().toISOString(),
    phone: "",
    confirmed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: { provider: "email", providers: ["email"] },
    user_metadata: { full_name: "Admin (Demo)" },
    identities: [],
    is_anonymous: false,
  } as User;
}

function createDemoSession(user: User): Session {
  return {
    access_token: "demo-access-token",
    refresh_token: "demo-refresh-token",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user,
  } as Session;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: Error | null }> => {
    // Demo login bypass — works everywhere except production domain
    if (!isProduction && email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const demoUser = createDemoUser();
      const demoSession = createDemoSession(demoUser);
      setUser(demoUser);
      setSession(demoSession);
      return { error: null };
    }

    // Send credentials exactly as typed — no trim/transform on password
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (!error) return { error: null };

    if (error.message.includes('Invalid login credentials') ||
        error.message.includes('invalid_credentials')) {
      return { error: new Error('Wrong email or password. Please try again.') };
    }
    if (error.message.includes('Email not confirmed')) {
      return { error: new Error('Please confirm your email first. Check your inbox.') };
    }
    return { error: new Error(error.message) };
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<{
    error: Error | null;
    needsEmailConfirmation?: boolean;
  }> => {
    // Send email trimmed, password exactly as typed — no transform
    const trimmedName = name?.trim();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      ...(trimmedName ? { options: { data: { full_name: trimmedName } } } : {}),
    });

    if (error) {
      if (error.message.includes('already registered') ||
          error.message.includes('User already registered') ||
          error.status === 400) {
        return { error: new Error('An account with this email already exists. Try logging in instead.') };
      }
      return { error: new Error(error.message) };
    }

    // Supabase may return a fake success for duplicate emails (email enumeration protection).
    // Detect this: the user object has an empty identities array.
    if (data.user && data.user.identities?.length === 0) {
      return { error: new Error('An account with this email already exists. Try logging in instead.') };
    }

    // If signup succeeded but no session — email confirmation is enabled.
    // Don't attempt auto-sign-in (it will fail). Signal to the UI to show confirmation screen.
    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    // Demo session — just clear state, no Supabase call needed
    if (user?.id.startsWith("demo-")) {
      setUser(null);
      setSession(null);
      window.location.href = '/login';
      return { error: null };
    }

    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = '/login';
    }
    return { error };
  }, [user]);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    return { error };
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
