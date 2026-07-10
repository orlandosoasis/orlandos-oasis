import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

Deno.serve(async () => {
  const targets = [
    { email: "tech@example.com", password: "TechDemo!2026", role: "technician", full_name: "Mike Johnson", first_name: "Mike", last_name: "Johnson" },
    { email: "demo@example.com", password: "HomeDemo!2026", role: "homeowner", full_name: "John Smith", first_name: "John", last_name: "Smith" },
  ];
  const out: Record<string, unknown> = {};
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  for (const t of targets) {
    let u = list.users.find((x) => x.email?.toLowerCase() === t.email);
    if (!u) {
      const { data, error } = await admin.auth.admin.createUser({
        email: t.email, password: t.password, email_confirm: true,
        user_metadata: { full_name: t.full_name, first_name: t.first_name, last_name: t.last_name, role: t.role },
      });
      if (error) { out[t.email] = { error: error.message }; continue; }
      u = data.user!;
    } else {
      const { error } = await admin.auth.admin.updateUserById(u.id, { password: t.password, email_confirm: true });
      if (error) { out[t.email] = { error: error.message }; continue; }
    }
    await admin.from("profiles").update({ role: t.role, full_name: t.full_name, first_name: t.first_name, last_name: t.last_name }).eq("id", u.id);
    out[t.email] = { id: u.id, ok: true };
  }
  return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json" } });
});
