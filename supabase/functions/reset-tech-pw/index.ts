import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { autoRefreshToken: false, persistSession: false } });
Deno.serve(async () => {
  const { error } = await admin.auth.admin.updateUserById("09295e03-1948-4ddf-b131-7b948a73c7cd", { password: "TechDemo!2026", email_confirm: true });
  return new Response(JSON.stringify({ ok: !error, error: error?.message }), { headers: { "Content-Type": "application/json" } });
});
