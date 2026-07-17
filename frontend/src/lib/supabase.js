import { createClient } from "@supabase/supabase-js";

// Frontend uses the ANON key only. Never put the service role key here.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
