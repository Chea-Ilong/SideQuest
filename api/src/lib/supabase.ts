import { createClient } from '@supabase/supabase-js';
import { config } from '../config/index.js';

// Server-side admin client: bypasses RLS using service role key.
// NEVER expose this key to the frontend.
export const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
);
