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

export const HOMEOWNERS: TechHomeowner[] = [
  { id: "ho-1", name: "John Smith", phone: "(407) 555-1234", email: "john.smith@email.com" },
  { id: "ho-2", name: "Lisa Martinez", phone: "(407) 555-8821", email: "lisa.martinez@email.com" },
  { id: "ho-3", name: "David Wilson", phone: "(407) 555-3344", email: "david.wilson@email.com" },
];

export const POOLS: TechPool[] = [
  {
    id: "pool-1",
    homeownerId: "ho-1",
    address: "123 Main Street",
    city: "Miami",
    state: "FL",
    zip: "33101",
    poolType: "In-ground",
    poolSize: "Medium (15k–25k gallons)",
    waterType: "Chlorine",
    equipment: "Hayward pump, sand filter, automatic chlorinator",
    accessMethod: "gate",
    accessDetail: "Code: 4521",
  },
  {
    id: "pool-2",
    homeownerId: "ho-2",
    address: "456 Palm Avenue",
    city: "Orlando",
    state: "FL",
    zip: "32801",
    poolType: "In-ground",
    poolSize: "Large (25k+ gallons)",
    waterType: "Saltwater",
    equipment: "Pentair pump, cartridge filter, salt cell generator",
    accessMethod: "home",
    accessDetail: "",
  },
  {
    id: "pool-3",
    homeownerId: "ho-3",
    address: "789 Sunset Drive",
    city: "Tampa",
    state: "FL",
    zip: "33601",
    poolType: "Above-ground",
    poolSize: "Small (under 15k gallons)",
    waterType: "Chlorine",
    equipment: "Intex pump, cartridge filter",
    accessMethod: "key",
    accessDetail: "Key under the flowerpot by the back door",
  },
];

export function createTechServices(): TechService[] {
  return [
    {
      id: "svc-1",
      poolId: "pool-1",
      homeownerId: "ho-1",
      serviceType: "3-Hour Pool Service",
      hours: 3,
      date: new Date(2026, 2, 18),
      timeWindow: "morning",
      status: "scheduled",
    },
    {
      id: "svc-2",
      poolId: "pool-2",
      homeownerId: "ho-2",
      serviceType: "1-Hour Pool Service",
      hours: 1,
      date: new Date(2026, 2, 19),
      timeWindow: "afternoon",
      status: "scheduled",
    },
    {
      id: "svc-3",
      poolId: "pool-3",
      homeownerId: "ho-3",
      serviceType: "3-Hour Pool Service",
      hours: 3,
      date: new Date(2026, 2, 22),
      timeWindow: "morning",
      status: "scheduled",
    },
    {
      id: "svc-4",
      poolId: "pool-1",
      homeownerId: "ho-1",
      serviceType: "3-Hour Pool Service",
      hours: 3,
      date: new Date(2026, 1, 25),
      timeWindow: "morning",
      status: "completed",
      completedTasks: SERVICE_TASKS,
      techNotes: "Skimmer basket was heavily filled with leaves. Adjusted chlorine slightly due to recent rain. Filter pressure normal.",
      startedAt: "8:02 AM",
      completedAt: "11:42 AM",
    },
    {
      id: "svc-5",
      poolId: "pool-2",
      homeownerId: "ho-2",
      serviceType: "1-Hour Pool Service",
      hours: 1,
      date: new Date(2026, 1, 20),
      timeWindow: "afternoon",
      status: "completed",
      completedTasks: ["Surface skimming & debris removal", "Check & adjust chemical levels", "Empty skimmer & pump baskets"],
      techNotes: "Quick refresh completed. Chemical levels were good. No issues found.",
      startedAt: "1:08 PM",
      completedAt: "2:15 PM",
    },
    {
      id: "svc-6",
      poolId: "pool-3",
      homeownerId: "ho-3",
      serviceType: "3-Hour Pool Service",
      hours: 3,
      date: new Date(2026, 2, 25),
      timeWindow: "evening",
      status: "scheduled",
    },
    // Extra "today" jobs (Mar 18, 2026) so the Jobs tab demo shows realistic counts
    {
      id: "svc-7",
      poolId: "pool-2",
      homeownerId: "ho-2",
      serviceType: "1-Hour Pool Service",
      hours: 1,
      date: new Date(2026, 2, 18),
      timeWindow: "afternoon",
      status: "scheduled",
    },
    {
      id: "svc-8",
      poolId: "pool-3",
      homeownerId: "ho-3",
      serviceType: "3-Hour Pool Service",
      hours: 3,
      date: new Date(2026, 2, 18),
      timeWindow: "morning",
      status: "completed",
      completedTasks: SERVICE_TASKS,
      techNotes: "Routine service complete. All chemistry within range.",
      startedAt: "8:10 AM",
      completedAt: "11:05 AM",
    },
  ];
}

export function getHomeowner(id: string) {
  return HOMEOWNERS.find((h) => h.id === id);
}

export function getPool(id: string) {
  return POOLS.find((p) => p.id === id);
}

export function getPoolFullAddress(pool: TechPool) {
  return [pool.address, pool.city, pool.state, pool.zip].filter(Boolean).join(", ");
}
