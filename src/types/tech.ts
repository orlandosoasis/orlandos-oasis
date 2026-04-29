// Domain types and shared formatting utilities for the technician portal.

export interface TechHomeowner {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface TechPool {
  id: string;
  homeownerId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  poolType: string;
  poolSize: string;
  waterType: string;
  equipment: string;
  accessMethod: string;
  accessDetail: string;
}

export type TechServiceStatus = "scheduled" | "in_progress" | "completed";

export interface TechService {
  id: string;
  poolId: string;
  homeownerId: string;
  serviceType: string;
  hours: number;
  date: Date;
  timeWindow: "morning" | "afternoon" | "evening";
  status: TechServiceStatus;
  completedTasks?: string[];
  techNotes?: string;
  startedAt?: string;
  completedAt?: string;
}

export const TIME_LABELS: Record<string, string> = {
  morning: "8:00 AM – 12:00 PM",
  afternoon: "12:00 PM – 4:00 PM",
  evening: "4:00 PM – 6:00 PM",
};

export const FULL_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateFull(d: Date) {
  return `${FULL_DAYS[d.getDay()]}, ${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatDateShort(d: Date) {
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function getPoolFullAddress(pool: TechPool) {
  return [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ");
}

export const SERVICE_TASKS = [
  "Surface skimming & debris removal",
  "Walls & floor brushing",
  "Vacuum pool floor",
  "Empty skimmer & pump baskets",
  "Check & adjust chemical levels",
  "Backwash / rinse filter",
  "Inspect equipment for issues",
  "Tile line scrubbing",
];
