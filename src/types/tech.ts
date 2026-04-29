// Domain types for the technician portal — re-exports keep legacy mock-backed
// pages compiling while new code consumes from src/types/.
export type {
  TechHomeowner,
  TechPool,
  TechService,
  TechServiceStatus,
} from "@/data/techMockData";

export {
  TIME_LABELS,
  FULL_DAYS,
  SHORT_MONTHS,
  SERVICE_TASKS,
  formatDateFull,
  formatDateShort,
  getPoolFullAddress,
} from "@/data/techMockData";
