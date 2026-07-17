import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Backend uses the SERVICE ROLE key — this bypasses RLS, so it must never be
// exposed to the frontend. Only the backend process should hold this key.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn(
    "[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — set them in backend/.env"
  );
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
