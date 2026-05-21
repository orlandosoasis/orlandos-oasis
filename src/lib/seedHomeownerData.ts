/**
 * Seed homeowner pool + recurring services into Supabase from whatever
 * client-side onboarding data we have (BookingContext, checkoutData, profile).
 *
 * Idempotent: only inserts when the user has no pool or no upcoming services.
 */
import { supabase } from "@/integrations/supabase/client";
import type { BookingData, CheckoutData } from "@/contexts/BookingContext";

const VOUCHER_LABELS: Record<string, { label: string; hours: number }> = {
  weekly: { label: "Weekly Pool Service", hours: 2 },
  "twice-weekly": { label: "Twice Per Week Pool Service", hours: 2 },
  "three-weekly": { label: "Three Times Per Week Pool Service", hours: 2 },
  biweekly: { label: "Bi-Weekly Pool Service", hours: 2 },
  monthly: { label: "Monthly Pool Service", hours: 2 },
  once: { label: "One-Time Pool Service", hours: 2 },
};

const POOL_SIZE_VALUES: Record<string, string> = {
  small: "small",
  medium: "medium",
  large: "large",
};

function toDateOnly(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function generateFutureDates(start: Date, frequency: string, count: number): Date[] {
  const dates: Date[] = [];
  const endOfYear = new Date(start.getFullYear() + 1, 11, 31);
  if (frequency === "once") return [new Date(start)];

  if (frequency === "twice-weekly") {
    let current = new Date(start);
    let toggle = true;
    dates.push(new Date(current));
    while (dates.length < count) {
      current = new Date(current);
      current.setDate(current.getDate() + (toggle ? 3 : 4));
      toggle = !toggle;
      if (current > endOfYear) break;
      dates.push(new Date(current));
    }
    return dates;
  }
  if (frequency === "three-weekly") {
    const gaps = [2, 2, 3];
    let current = new Date(start);
    let gapIdx = 0;
    dates.push(new Date(current));
    while (dates.length < count) {
      current = new Date(current);
      current.setDate(current.getDate() + gaps[gapIdx % 3]);
      gapIdx++;
      if (current > endOfYear) break;
      dates.push(new Date(current));
    }
    return dates;
  }

  const intervalDays =
    frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : 30; // monthly
  let current = new Date(start);
  dates.push(new Date(current));
  while (dates.length < count) {
    current = new Date(current);
    current.setDate(current.getDate() + intervalDays);
    if (current > endOfYear) break;
    dates.push(new Date(current));
  }
  return dates;
}

export interface SeedInputs {
  userId: string;
  booking: BookingData | null;
  checkoutData: CheckoutData | null;
  profile: {
    streetAddress?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
  } | null;
}

interface SeedResult {
  poolId: string | null;
  servicesInserted: number;
  poolInserted: boolean;
}

const FUTURE_VISIT_COUNT = 12;

/**
 * Idempotent. Run once per session per homeowner; safe to re-run.
 */
export async function seedHomeownerData(inputs: SeedInputs): Promise<SeedResult> {
  const { userId, booking, checkoutData, profile } = inputs;

  // 1. Find existing pool for this homeowner.
  const { data: existingPools, error: poolErr } = await supabase
    .from("pools")
    .select("id, frequency")
    .eq("homeowner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (poolErr) throw poolErr;

  let poolId = existingPools?.[0]?.id ?? null;
  let poolFrequency = existingPools?.[0]?.frequency ?? null;
  let poolInserted = false;

  // 2. Insert a pool if we have enough info and one doesn't exist.
  if (!poolId) {
    const address =
      booking?.pool?.address ||
      profile?.streetAddress ||
      "";
    if (!address.trim()) {
      // Not enough info yet; let the booking flow create the pool.
      return { poolId: null, servicesInserted: 0, poolInserted: false };
    }

    const frequency =
      booking?.recurrence ||
      (booking?.frequency === "once" ? "once" : booking?.frequency) ||
      checkoutData?.frequency ||
      "monthly";

    const poolSizeRaw =
      booking?.pool?.poolSize ||
      checkoutData?.poolSize ||
      "medium";
    const poolSize = POOL_SIZE_VALUES[poolSizeRaw] || poolSizeRaw;

    const { data: inserted, error: insErr } = await supabase
      .from("pools")
      .insert({
        homeowner_id: userId,
        address,
        city: booking?.pool?.city || profile?.city || "",
        state: booking?.pool?.state || profile?.state || "",
        zip: booking?.pool?.zip || profile?.zipCode || checkoutData?.customerZipcode || "",
        pool_type: booking?.pool?.poolType || "In-ground",
        pool_size: poolSize,
        access_method: booking?.pool?.accessMethod || "home",
        access_detail: booking?.pool?.accessDetail || "",
        frequency,
      })
      .select("id, frequency")
      .single();
    if (insErr) throw insErr;
    poolId = inserted.id;
    poolFrequency = inserted.frequency;
    poolInserted = true;
  }

  // 3. Insert future services if none exist for this pool.
  const { data: existingServices, error: svcErr } = await supabase
    .from("services")
    .select("id, service_date")
    .eq("homeowner_id", userId)
    .eq("pool_id", poolId)
    .gte("service_date", toDateOnly(new Date()));
  if (svcErr) throw svcErr;

  let servicesInserted = 0;
  if ((existingServices?.length ?? 0) === 0) {
    const frequency = poolFrequency || checkoutData?.frequency || "monthly";
    const labelMeta = VOUCHER_LABELS[frequency] || VOUCHER_LABELS.monthly;
    const startDate =
      booking?.scheduleData?.selectedDate
        ? new Date(booking.scheduleData.selectedDate)
        : new Date();
    startDate.setHours(0, 0, 0, 0);
    const timeWindow = booking?.scheduleData?.timeWindow || "morning";
    const dates = generateFutureDates(startDate, frequency, FUTURE_VISIT_COUNT);

    const rows = dates.map((d) => ({
      homeowner_id: userId,
      pool_id: poolId!,
      service_type: labelMeta.label,
      hours: labelMeta.hours,
      service_date: toDateOnly(d),
      time_window: timeWindow,
      status: "scheduled" as const,
    }));

    if (rows.length > 0) {
      const { error: insSvcErr } = await supabase.from("services").insert(rows);
      if (insSvcErr) throw insSvcErr;
      servicesInserted = rows.length;
    }
  }

  return { poolId, servicesInserted, poolInserted };
}
