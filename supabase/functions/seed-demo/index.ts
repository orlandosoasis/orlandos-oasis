// Idempotent demo data seeder.
// - Creates demo homeowner / technician / admin auth users (auto-confirmed).
// - Inserts 3 pools, 6 services (3 scheduled, 3 completed), 2 reviews, 1 issue.
// - Optional: pass { linkExtraToUserId: "<uuid>" } in the request body to also
//   attach 2 extra pools + services to the currently logged-in homeowner so
//   their dashboard isn't empty.
//
// Safe to call repeatedly — uses email lookup before creating users and
// `ON CONFLICT` style guards on inserts (we check existence first).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_USERS = [
  {
    email: "demo@example.com",
    password: "demo1234",
    full_name: "John Smith",
    first_name: "John",
    last_name: "Smith",
    role: "homeowner" as const,
    phone: "(407) 555-1234",
    street_address: "742 Palm Grove Dr",
    city: "Orlando",
    state: "FL",
    zip_code: "32801",
  },
  {
    email: "tech@example.com",
    password: "tech1234",
    full_name: "Mike Johnson",
    first_name: "Mike",
    last_name: "Johnson",
    role: "technician" as const,
    phone: "(407) 555-9988",
    street_address: "1500 Lakeside Ave",
    city: "Orlando",
    state: "FL",
    zip_code: "32801",
  },
  {
    email: "admin@example.com",
    password: "admin1234",
    full_name: "Sarah Admin",
    first_name: "Sarah",
    last_name: "Admin",
    role: "admin" as const,
    phone: "(407) 555-7777",
    street_address: "100 Office Way",
    city: "Orlando",
    state: "FL",
    zip_code: "32801",
  },
];

async function findUserByEmail(email: string): Promise<string | null> {
  // listUsers paginates; one page is plenty for our demo size.
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  if (error) throw error;
  const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  return found?.id ?? null;
}

async function ensureUser(u: typeof DEMO_USERS[number]): Promise<string> {
  const existing = await findUserByEmail(u.email);
  if (existing) {
    // Make sure profile reflects the latest demo metadata.
    await admin
      .from("profiles")
      .update({
        full_name: u.full_name,
        first_name: u.first_name,
        last_name: u.last_name,
        role: u.role,
        phone: u.phone,
        street_address: u.street_address,
        city: u.city,
        state: u.state,
        zip_code: u.zip_code,
      })
      .eq("id", existing);
    return existing;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: {
      full_name: u.full_name,
      first_name: u.first_name,
      last_name: u.last_name,
      role: u.role,
    },
  });
  if (error) throw error;
  const id = data.user!.id;

  // The handle_new_user trigger fills profiles; patch the address fields it
  // doesn't read out of metadata.
  await admin
    .from("profiles")
    .update({
      phone: u.phone,
      street_address: u.street_address,
      city: u.city,
      state: u.state,
      zip_code: u.zip_code,
    })
    .eq("id", id);

  return id;
}

interface SeedPool {
  marker: string; // unique address used for idempotency lookup
  homeowner_id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  pool_type: string;
  pool_size: string;
  water_type: string;
  equipment: string;
  access_method: string;
  access_detail: string;
}

async function ensurePool(pool: SeedPool): Promise<string> {
  const { data: existing } = await admin
    .from("pools")
    .select("id")
    .eq("homeowner_id", pool.homeowner_id)
    .eq("address", pool.address)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("pools")
    .insert({
      homeowner_id: pool.homeowner_id,
      address: pool.address,
      city: pool.city,
      state: pool.state,
      zip: pool.zip,
      pool_type: pool.pool_type,
      pool_size: pool.pool_size,
      water_type: pool.water_type,
      equipment: pool.equipment,
      access_method: pool.access_method,
      access_detail: pool.access_detail,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

interface SeedService {
  pool_id: string;
  homeowner_id: string;
  technician_id: string;
  service_type: string;
  hours: number;
  service_date: string; // YYYY-MM-DD
  time_window: "morning" | "afternoon" | "evening";
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  completed_tasks?: string[] | null;
  tech_notes?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
}

async function ensureService(svc: SeedService): Promise<string> {
  // Idempotency = (pool_id, service_date, time_window) is unique enough for demo.
  const { data: existing } = await admin
    .from("services")
    .select("id")
    .eq("pool_id", svc.pool_id)
    .eq("service_date", svc.service_date)
    .eq("time_window", svc.time_window)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin.from("services").insert(svc).select("id").single();
  if (error) throw error;
  return data.id;
}

const SERVICE_TASKS = [
  "Surface skimming & debris removal",
  "Walls & floor brushing",
  "Vacuum pool floor",
  "Empty skimmer & pump baskets",
  "Check & adjust chemical levels",
  "Backwash / rinse filter",
  "Inspect equipment for issues",
  "Tile line scrubbing",
];

function isoDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ===== Admin-only access guard =====
    // Without this check, anyone with the function URL could call it and
    // pollute / overwrite demo data. We verify the caller's JWT and confirm
    // they have role='admin' in the profiles table before proceeding.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { data: profile, error: profileErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (profileErr || profile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // ===== End guard =====

    let linkExtraToUserId: string | null = null;
    try {
      const body = await req.json();
      if (body?.linkExtraToUserId) linkExtraToUserId = String(body.linkExtraToUserId);
    } catch {
      // No body — that's fine.
    }

    // 1. Demo auth users + profiles.
    const userIds: Record<string, string> = {};
    for (const u of DEMO_USERS) {
      userIds[u.role] = await ensureUser(u);
    }
    const homeownerId = userIds.homeowner;
    const techId = userIds.technician;

    // 2. Three pools owned by the demo homeowner.
    const pool1Id = await ensurePool({
      marker: "pool-1",
      homeowner_id: homeownerId,
      address: "742 Palm Grove Dr",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      pool_type: "In-ground",
      pool_size: "Medium (15k–25k gallons)",
      water_type: "Chlorine",
      equipment: "Hayward pump, sand filter, automatic chlorinator",
      access_method: "gate",
      access_detail: "Code: 4521",
    });
    const pool2Id = await ensurePool({
      marker: "pool-2",
      homeowner_id: homeownerId,
      address: "1100 Sunset Blvd",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      pool_type: "In-ground",
      pool_size: "Large (25k+ gallons)",
      water_type: "Saltwater",
      equipment: "Pentair pump, cartridge filter, salt cell generator",
      access_method: "home",
      access_detail: "",
    });
    const pool3Id = await ensurePool({
      marker: "pool-3",
      homeowner_id: homeownerId,
      address: "58 Lakewood Ct",
      city: "Orlando",
      state: "FL",
      zip: "32801",
      pool_type: "Above-ground",
      pool_size: "Small (under 15k gallons)",
      water_type: "Chlorine",
      equipment: "Intex pump, cartridge filter",
      access_method: "key",
      access_detail: "Key under flowerpot by back door",
    });

    // 3. Services — 3 scheduled (future), 3 completed (past).
    const services: SeedService[] = [
      {
        pool_id: pool1Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "3-Hour Pool Service", hours: 3,
        service_date: isoDate(3), time_window: "morning", status: "scheduled",
      },
      {
        pool_id: pool2Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "1-Hour Pool Service", hours: 1,
        service_date: isoDate(5), time_window: "afternoon", status: "scheduled",
      },
      {
        pool_id: pool3Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "3-Hour Pool Service", hours: 3,
        service_date: isoDate(8), time_window: "morning", status: "scheduled",
      },
      {
        pool_id: pool1Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "3-Hour Pool Service", hours: 3,
        service_date: isoDate(-7), time_window: "morning", status: "completed",
        completed_tasks: SERVICE_TASKS,
        tech_notes: "Skimmer basket heavily filled with leaves. Adjusted chlorine for recent rain. Filter pressure normal.",
        started_at: new Date(Date.now() - 7 * 86400000 + 8 * 3600000).toISOString(),
        completed_at: new Date(Date.now() - 7 * 86400000 + 11.7 * 3600000).toISOString(),
      },
      {
        pool_id: pool2Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "1-Hour Pool Service", hours: 1,
        service_date: isoDate(-14), time_window: "afternoon", status: "completed",
        completed_tasks: ["Surface skimming & debris removal", "Check & adjust chemical levels", "Empty skimmer & pump baskets"],
        tech_notes: "Quick refresh complete. Chemistry good. No issues.",
        started_at: new Date(Date.now() - 14 * 86400000 + 13 * 3600000).toISOString(),
        completed_at: new Date(Date.now() - 14 * 86400000 + 14.25 * 3600000).toISOString(),
      },
      {
        pool_id: pool3Id, homeowner_id: homeownerId, technician_id: techId,
        service_type: "3-Hour Pool Service", hours: 3,
        service_date: isoDate(-21), time_window: "morning", status: "completed",
        completed_tasks: SERVICE_TASKS,
        tech_notes: "Routine service complete. All chemistry within range.",
        started_at: new Date(Date.now() - 21 * 86400000 + 8.2 * 3600000).toISOString(),
        completed_at: new Date(Date.now() - 21 * 86400000 + 11.1 * 3600000).toISOString(),
      },
    ];
    const serviceIds: string[] = [];
    for (const svc of services) serviceIds.push(await ensureService(svc));

    // 4. Two reviews (idempotent on reviewer_id+service_id+technician_id).
    const reviewSeeds = [
      {
        reviewer_id: homeownerId,
        technician_id: techId,
        service_id: serviceIds[3],
        rating: 5,
        message: "Great service. Pool looks perfect. Mike was professional and explained everything.",
        status: "approved",
      },
      {
        reviewer_id: homeownerId,
        technician_id: techId,
        service_id: serviceIds[4],
        rating: 5,
        message: "Quick and thorough. Pool sparkles afterwards.",
        status: "approved",
      },
    ];
    for (const r of reviewSeeds) {
      const { data: existing } = await admin
        .from("reviews")
        .select("id")
        .eq("reviewer_id", r.reviewer_id)
        .eq("service_id", r.service_id!)
        .maybeSingle();
      if (!existing) {
        const { error } = await admin.from("reviews").insert(r);
        if (error) throw error;
      }
    }

    // 5. One open issue.
    const { data: existingIssue } = await admin
      .from("issues")
      .select("id")
      .eq("homeowner_id", homeownerId)
      .eq("type", "Service Quality")
      .maybeSingle();
    if (!existingIssue) {
      const { error } = await admin.from("issues").insert({
        homeowner_id: homeownerId,
        service_id: serviceIds[3],
        type: "Service Quality",
        message: "Pool still had a few leaves after the visit.",
        related_service: "3-Hour Pool Service",
        service_date: isoDate(-7),
      });
      if (error) throw error;
    }

    // 6. Optional: link extra pool/service to currently logged-in homeowner.
    let linkedExtras: { poolId: string; serviceId: string } | null = null;
    if (linkExtraToUserId && linkExtraToUserId !== homeownerId) {
      const extraPoolId = await ensurePool({
        marker: "extra-pool",
        homeowner_id: linkExtraToUserId,
        address: "Your Demo Pool, 1 Sample St",
        city: "Orlando",
        state: "FL",
        zip: "32801",
        pool_type: "In-ground",
        pool_size: "Medium (15k–25k gallons)",
        water_type: "Chlorine",
        equipment: "Standard pump and filter setup",
        access_method: "gate",
        access_detail: "Code: 1234",
      });
      const extraSvcId = await ensureService({
        pool_id: extraPoolId,
        homeowner_id: linkExtraToUserId,
        technician_id: techId,
        service_type: "3-Hour Pool Service",
        hours: 3,
        service_date: isoDate(2),
        time_window: "morning",
        status: "scheduled",
      });
      linkedExtras = { poolId: extraPoolId, serviceId: extraSvcId };
    }

    return new Response(
      JSON.stringify({
        ok: true,
        users: {
          homeowner: { id: homeownerId, email: "demo@example.com" },
          technician: { id: techId, email: "tech@example.com" },
          admin: { id: userIds.admin, email: "admin@example.com" },
        },
        counts: {
          pools: 3,
          services: services.length,
          reviews: reviewSeeds.length,
          issues: 1,
        },
        linkedExtras,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("seed-demo failed", e);
    return new Response(
      JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
