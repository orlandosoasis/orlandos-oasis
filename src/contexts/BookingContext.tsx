import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { ServiceStatus } from "@/components/StatusBadge";

export type CleaningFrequency = "once" | "monthly";
export type Recurrence = "monthly" | "weekly" | "biweekly";
export type TimeWindow = "morning" | "afternoon" | "evening";
export type AccessMethod = "home" | "gate" | "key" | "other";

export interface PassOption {
  id: string;
  hours: number;
  label: string;
  description: string;
  originalPrice: number;
  discountPrice: number;
  percentOff: number;
  isMostPopular: boolean;
}

export interface MonthlyPlan {
  id: string;
  label: string;
  description: string;
  monthlyPrice: number;
  isMostPopular: boolean;
}

export interface PoolProfile {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  poolType: string;
  poolSize: string;
  accessMethod: AccessMethod;
  accessDetail: string;
}

export interface ScheduleData {
  selectedDate: Date;
  timeWindow: TimeWindow;
  accessMethod: AccessMethod;
  accessDetail: string;
  addons: { id: string; name: string; price: number }[];
  addonsTotal: number;
}

export interface TechnicianInfo {
  name: string;
  initials: string;
  rating: number;
  isAssigned: boolean;
}

export interface PoolData {
  address: string;
  city: string;
  state: string;
  zip: string;
  poolType: string;
  poolSize: string;
  accessMethod: AccessMethod;
  accessDetail: string;
  hasPets: boolean;
}

export interface BookingData {
  frequency: CleaningFrequency;
  selectedPass: PassOption;
  selectedPlan?: MonthlyPlan;
  recurrence?: Recurrence;
  scheduleData: ScheduleData;
  technician: TechnicianInfo;
  specialNotes?: string;
  pool: PoolData;
  status?: ServiceStatus;
}

/** Data saved from the checkout/voucher flow on the landing page */
export interface CheckoutData {
  serviceName: string;
  serviceDescription: string;
  frequency: string; // weekly, biweekly, monthly, once
  originalPrice: number;
  discountPrice: number;
  customerEmail: string;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerZipcode: string;
}

interface BookingContextType {
  booking: BookingData | null;
  setBooking: (data: BookingData) => void;
  clearBooking: () => void;
  checkoutData: CheckoutData | null;
  setCheckoutData: (data: CheckoutData) => void;
  clearCheckoutData: () => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const CHECKOUT_STORAGE_KEY = "orlandos_oasis_checkout";
const BOOKING_STORAGE_KEY = "orlandos_oasis_booking";

// Mock technician pool for auto-matching
const TECH_POOL: TechnicianInfo[] = [
  { name: "Carlos M.", initials: "CM", rating: 4.9, isAssigned: true },
  { name: "Maria S.", initials: "MS", rating: 4.8, isAssigned: true },
  { name: "David R.", initials: "DR", rating: 4.7, isAssigned: true },
  { name: "Ana P.", initials: "AP", rating: 4.9, isAssigned: true },
];

function matchTechnician(): TechnicianInfo {
  const index = Math.floor(Math.random() * TECH_POOL.length);
  return TECH_POOL[index];
}

function loadFromStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch {
    return null;
  }
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [booking, setBookingState] = useState<BookingData | null>(() => {
    const stored = loadFromStorage<BookingData>(BOOKING_STORAGE_KEY);
    if (stored?.scheduleData?.selectedDate) {
      stored.scheduleData.selectedDate = new Date(stored.scheduleData.selectedDate);
    }
    return stored;
  });

  const [checkoutData, setCheckoutDataState] = useState<CheckoutData | null>(
    () => loadFromStorage<CheckoutData>(CHECKOUT_STORAGE_KEY)
  );

  const setBooking = (data: BookingData) => {
    setBookingState(data);
    localStorage.setItem(BOOKING_STORAGE_KEY, JSON.stringify(data));
  };

  const clearBooking = () => {
    setBookingState(null);
    localStorage.removeItem(BOOKING_STORAGE_KEY);
  };

  const setCheckoutData = (data: CheckoutData) => {
    setCheckoutDataState(data);
    localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(data));
  };

  const clearCheckoutData = () => {
    setCheckoutDataState(null);
    localStorage.removeItem(CHECKOUT_STORAGE_KEY);
  };

  return (
    <BookingContext.Provider value={{ booking, setBooking, clearBooking, checkoutData, setCheckoutData, clearCheckoutData }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

export { matchTechnician };
