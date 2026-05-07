// One-shot bootstrap: creates the three demo auth users (homeowner, technician, admin).
// No auth guard — safe because it only creates fixed demo accounts idempotently.
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

const USERS = [
  { email: "demo@example.com", password: "demo1234", full_name: "John Smith", first_name: "John", last_name: "Smith", role: "homeowner" },
  { email: "tech@example.com", password: "tech1234", full_name: "Mike Johnson", first_name: "Mike", last_name: "Johnson", role: "technician" },
  { email: "admin@example.com", password: "admin1234", full_name: "Sarah Admin", first_name: "Sarah", last_name: "Admin", role: "admin" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const results: Record<string, unknown> = {};
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

    for (const u of USERS) {
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = list.users.find((x) => x.email?.toLowerCase() === u.email);
      let id = existing?.id;
      if (!id) {
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, first_name: u.first_name, last_name: u.last_name, role: u.role },
        });
        if (error) throw new Error(`${u.email}: ${error.message}`);
        id = data.user!.id;
      }
      // Ensure profile role is correct
      await admin.from("profiles").update({ role: u.role, full_name: u.full_name, first_name: u.first_name, last_name: u.last_name }).eq("id", id!);
      // Do NOT return plaintext passwords in the response.
      results[u.role] = { email: u.email, id };
    }
    return new Response(JSON.stringify({ ok: true, users: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
