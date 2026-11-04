import { createClient } from '@supabase/supabase-js';

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { 
      autoRefreshToken: false, 
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

export function getSupabaseServer() {
  return supabaseServer;
}