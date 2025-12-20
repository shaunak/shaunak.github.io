import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || "";
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";

// IMPORTANT:
// Blog auth uses a separate storage key so it doesn't overwrite the "main" auth
// session used by the DenLoop area of the site.
export const blogSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: "sb-blog-auth",
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});


