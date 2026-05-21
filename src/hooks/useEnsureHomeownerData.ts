import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { seedHomeownerData } from "@/lib/seedHomeownerData";
import { useBooking } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Runs once per session to migrate any client-side onboarding data
 * (BookingContext + checkoutData) into Supabase. Idempotent and safe.
 *
 * Returns nothing — refetches happen via React Query invalidation.
 */
export function useEnsureHomeownerData() {
  const { user } = useAuth();
  const { booking, checkoutData } = useBooking();
  const qc = useQueryClient();
  const ranForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    if (ranForRef.current === user.id) return;
    ranForRef.current = user.id;

    seedHomeownerData({
      userId: user.id,
      booking,
      checkoutData,
      profile: {
        streetAddress: user.streetAddress ?? null,
        city: user.city ?? null,
        state: user.state ?? null,
        zipCode: user.zipCode ?? null,
      },
    })
      .then((res) => {
        if (res.poolInserted || res.servicesInserted > 0) {
          qc.invalidateQueries({ queryKey: ["services"] });
          qc.invalidateQueries({ queryKey: ["pools"] });
        }
      })
      .catch((err) => {
        // Don't throw — UI will simply fall back to empty state.
        console.warn("seedHomeownerData failed:", err);
        // Allow a retry on next mount.
        ranForRef.current = null;
      });
  }, [user?.id, user?.streetAddress, user?.city, user?.state, user?.zipCode, booking, checkoutData, qc]);
}
