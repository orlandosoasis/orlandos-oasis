// approve-technician: called by admin to approve an applicant.
// Creates a Supabase auth user + technician profile, stores credentials
// in technician_applications.generated_email / generated_password.
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

function randomPassword(len = 12): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const all = upper + lower + digits + special;
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  let pw = upper[arr[0] % upper.length]
    + lower[arr[1] % lower.length]
    + digits[arr[2] % digits.length]
    + special[arr[3] % special.length];
  for (let i = 4; i < len; i++) pw += all[arr[i] % all.length];
  // Shuffle
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Verify caller is an admin
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: caller, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", caller.user.id)
      .single();
    if (callerProfile?.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { applicationId } = await req.json();
    if (!applicationId) {
      return new Response(JSON.stringify({ error: "applicationId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the application
    const { data: app, error: appErr } = await admin
      .from("technician_applications")
      .select("*")
      .eq("id", applicationId)
      .single();
    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "Application not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Already approved — return stored credentials
    if (app.status === "approved" && app.generated_email && app.generated_password) {
      return new Response(JSON.stringify({
        email: app.generated_email,
        password: app.generated_password,
        profileId: app.technician_profile_id,
        alreadyApproved: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use applicant's own email as login email
    const loginEmail = app.email.toLowerCase().trim();
    const password = randomPassword();
    const fullName = `${app.first_name} ${app.last_name}`.trim();

    // Check if auth user already exists with this email
    let userId: string;
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === loginEmail);

    if (existing) {
      // Update password for existing user
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password });
    } else {
      // Create new auth user
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: loginEmail,
        password,
        email_confirm: true,
      });
      if (createErr || !newUser?.user) {
        return new Response(JSON.stringify({ error: createErr?.message ?? "Failed to create user" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = newUser.user.id;
    }

    // Upsert technician profile
    const { error: profileErr } = await admin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email: loginEmail,
      phone: app.phone ?? null,
      role: "technician",
      city: app.city ?? null,
      state: app.state ?? null,
      zip_code: app.zip ?? null,
      is_active: true,
    }, { onConflict: "id" });
    if (profileErr) {
      return new Response(JSON.stringify({ error: profileErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark application approved and store credentials
    const { error: updateErr } = await admin
      .from("technician_applications")
      .update({
        status: "approved",
        generated_email: loginEmail,
        generated_password: password,
        technician_profile_id: userId,
      })
      .eq("id", applicationId);
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      email: loginEmail,
      password,
      profileId: userId,
      alreadyApproved: false,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
