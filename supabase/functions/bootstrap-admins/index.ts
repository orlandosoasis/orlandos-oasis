// Creates the 3 admin accounts with random temporary passwords.
// Each admin uses "Forgot password" on the login page to set their own password.
// Idempotent: if an admin already exists, only role/name is reconciled.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const ADMINS = [
  { email: "chay@chayland.com", first_name: "Chay", last_name: "Land", full_name: "Chay Land" },
  { email: "orlando.garibay2@gmail.com", first_name: "Orlando", last_name: "Garibay", full_name: "Orlando Garibay" },
  { email: "gloryvherabad@gmail.com", first_name: "Gloryvher", last_name: "Abad", full_name: "Gloryvher Abad" },
];

const DEMO_EMAILS = ["demo@example.com", "tech@example.com", "admin@example.com"];

function randomPassword() {
  return crypto.randomUUID().replace(/-/g, "") + "A1!";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // ===== Admin-only access guard =====
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: profile } = await admin
      .from("profiles").select("role").eq("id", userData.user.id).maybeSingle();
    if (profile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin role required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ===== End guard =====

    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });

    // 1. Remove demo accounts.
    const removed: string[] = [];
    for (const e of DEMO_EMAILS) {
      const u = list.users.find((x) => x.email?.toLowerCase() === e);
      if (u) {
        await admin.auth.admin.deleteUser(u.id);
        removed.push(e);
      }
    }

    // 2. Create / reconcile admin accounts.
    const results: Record<string, unknown> = {};
    for (const a of ADMINS) {
      let user = list.users.find((x) => x.email?.toLowerCase() === a.email);
      let created = false;
      if (!user) {
        const { data, error } = await admin.auth.admin.createUser({
          email: a.email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: {
            full_name: a.full_name,
            first_name: a.first_name,
            last_name: a.last_name,
            role: "admin",
          },
        });
        if (error) throw new Error(`${a.email}: ${error.message}`);
        user = data.user!;
        created = true;
      }
      await admin.from("profiles").update({
        role: "admin",
        full_name: a.full_name,
        first_name: a.first_name,
        last_name: a.last_name,
      }).eq("id", user.id);
      results[a.email] = { id: user.id, created };
    }

    return new Response(JSON.stringify({ ok: true, removed, admins: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
