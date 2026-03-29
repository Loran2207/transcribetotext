import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import type { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean }>;
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

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{
    error: Error | null;
    needsEmailConfirmation?: boolean;
  }> => {
    // Send email trimmed, password exactly as typed — no transform
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: name.trim() },
      },
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
    const { error } = await supabase.auth.signOut();
    if (!error) {
      // Navigate to login after successful sign out
      window.location.href = '/login';
    }
    return { error };
  }, []);

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
