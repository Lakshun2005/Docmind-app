import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Prefer the service role key for server-side operations (bypasses RLS).
// If not set, fall back to the anon key (requires RLS policies to be open).
const serverKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serverKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Named export for backward compat
export { supabaseAdmin };

// Function-style export expected by the new API routes
export function createServerClient() {
  return supabaseAdmin;
}
