// approve-technician: called by admin to approve an applicant.
// Creates a Supabase auth user + technician profile, sends welcome email
// with credentials, stores them in technician_applications.
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
  let pw =
    upper[arr[0] % upper.length] +
    lower[arr[1] % lower.length] +
    digits[arr[2] % digits.length] +
    special[arr[3] % special.length];
  for (let i = 4; i < len; i++) pw += all[arr[i] % all.length];
  return pw.split("").sort(() => Math.random() - 0.5).join("");
}

async function sendWelcomeEmail(opts: {
  toEmail: string;
  toName: string;
  loginEmail: string;
  tempPassword: string;
  resetLink: string;
  appUrl: string;
}): Promise<void> {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    console.warn("RESEND_API_KEY not set — skipping welcome email");
    return;
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #0ea5e9; padding: 32px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; }
    .body { padding: 32px 40px; }
    .body p { color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .creds { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 20px 24px; margin: 24px 0; }
    .creds-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .creds-row:last-child { margin-bottom: 0; }
    .creds-label { font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .creds-value { font-size: 15px; font-weight: 700; color: #0f172a; font-family: monospace; }
    .btn { display: inline-block; background: #0ea5e9; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .note { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #92400e; }
    .footer { padding: 20px 40px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>Welcome to Orlando's Oasis</h1>
    </div>
    <div class="body">
      <p>Hi <strong>${opts.toName}</strong>,</p>
      <p>Congratulations! Your technician application has been <strong>approved</strong>. Your account is ready — here are your login credentials:</p>
      <div class="creds">
        <div class="creds-row">
          <div>
            <div class="creds-label">Email</div>
            <div class="creds-value">${opts.loginEmail}</div>
          </div>
        </div>
        <div class="creds-row">
          <div>
            <div class="creds-label">Temporary Password</div>
            <div class="creds-value">${opts.tempPassword}</div>
          </div>
        </div>
      </div>
      <p>We recommend setting your own password right away. Click the button below:</p>
      <a href="${opts.resetLink}" class="btn">Set My Password</a>
      <div class="note">
        ⚠️ This link expires in 24 hours. If it expires, use the "Forgot password" option on the login page.
      </div>
      <p style="margin-top:24px;">After setting your password, log in at:<br/>
        <a href="${opts.appUrl}" style="color:#0ea5e9;">${opts.appUrl}</a>
      </p>
    </div>
    <div class="footer">
      Orlando's Oasis Pool Services · You're receiving this because you were approved as a technician.
    </div>
  </div>
</body>
</html>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Orlando's Oasis <noreply@orlandosoasis.com>",
      to: [opts.toEmail],
      subject: "Your Orlando's Oasis Technician Account",
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("Resend error:", body);
  }
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

    // Already approved — return stored credentials (no new email)
    if (app.status === "approved" && app.generated_email && app.generated_password) {
      return new Response(JSON.stringify({
        email: app.generated_email,
        password: app.generated_password,
        profileId: app.technician_profile_id,
        alreadyApproved: true,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const loginEmail = app.email.toLowerCase().trim();
    const tempPassword = randomPassword();
    const fullName = `${app.first_name} ${app.last_name}`.trim();

    // Check if auth user already exists
    let userId: string;
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const existing = existingUsers?.users?.find((u) => u.email === loginEmail);

    if (existing) {
      userId = existing.id;
      await admin.auth.admin.updateUserById(userId, { password: tempPassword });
    } else {
      const { data: newUser, error: createErr } = await admin.auth.admin.createUser({
        email: loginEmail,
        password: tempPassword,
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

    // Generate a password-reset link so the technician can set their own password
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const appUrl = Deno.env.get("APP_URL") ?? "https://orlandosoasis.com";
    let resetLink = appUrl + "/login";
    try {
      const { data: linkData } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: loginEmail,
        options: { redirectTo: appUrl + "/login" },
      });
      if (linkData?.properties?.action_link) {
        resetLink = linkData.properties.action_link;
      }
    } catch (e) {
      console.warn("Could not generate reset link:", e);
    }

    // Mark application approved and store credentials
    const { error: updateErr } = await admin
      .from("technician_applications")
      .update({
        status: "approved",
        generated_email: loginEmail,
        generated_password: tempPassword,
        technician_profile_id: userId,
      })
      .eq("id", applicationId);
    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send welcome email (non-blocking — failure doesn't abort the approval)
    await sendWelcomeEmail({
      toEmail: loginEmail,
      toName: fullName,
      loginEmail,
      tempPassword,
      resetLink,
      appUrl,
    });

    return new Response(JSON.stringify({
      email: loginEmail,
      password: tempPassword,
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
