import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseMisconfigured = !supabaseUrl || !supabaseAnonKey;

if (supabaseMisconfigured) {
  console.warn(
    '[TranscribeToText] Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.',
  );
}

const configError = { message: 'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };

/**
 * Recursive proxy that returns safe no-op results for any property access or
 * method call, so the app renders (with auth errors) instead of crashing.
 */
function createStubClient(): SupabaseClient {
  const handler: ProxyHandler<Record<string, unknown>> = {
    get: (_target, prop) => {
      if (prop === 'then') return undefined; // prevent Promise-like behavior

      // supabase.auth.onAuthStateChange needs to return { data: { subscription } }
      if (prop === 'onAuthStateChange') {
        return () => ({ data: { subscription: { unsubscribe: () => {} } } });
      }
      // supabase.auth.getSession needs to return a thenable with { data: { session: null } }
      if (prop === 'getSession') {
        return () => Promise.resolve({ data: { session: null }, error: null });
      }
      // signInWithPassword, signUp, signOut → return { error }
      if (prop === 'signInWithPassword' || prop === 'signUp' || prop === 'signOut' || prop === 'resend' || prop === 'signInWithOAuth') {
        return () => Promise.resolve({ data: null, error: configError });
      }

      // For any other property access, return another proxy (supports chaining like supabase.auth.*)
      return new Proxy({} as Record<string, unknown>, handler);
    },
  };

  return new Proxy({} as unknown as SupabaseClient, handler);
}

export const supabase: SupabaseClient = supabaseMisconfigured
  ? createStubClient()
  : createClient(supabaseUrl, supabaseAnonKey);
