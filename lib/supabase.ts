import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Public client — lazy singleton so build-time collection doesn't crash when env vars are absent
let _supabase: SupabaseClient | null = null;
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabase) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) are not set");
      }
      _supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          fetch: (url, options) =>
            fetch(url, { ...options, cache: "no-store" }),
        },
      });
    }
    const value = (_supabase as any)[prop];
    return typeof value === "function" ? value.bind(_supabase) : value;
  },
});

// Server-only client with service role key (used for storage uploads, admin writes)
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
