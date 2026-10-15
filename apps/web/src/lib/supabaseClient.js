import { createClient } from '@supabase/supabase-js';

// The project URL and the *publishable* (anon) key are safe to ship in the browser.
// Never put the secret / service_role key here.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://hpodtwxixhchdveuygsk.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_PUBLISHABLE_KEY) {
  console.error('Missing VITE_SUPABASE_PUBLISHABLE_KEY — add it to apps/web/.env');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY || 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export default supabase;
