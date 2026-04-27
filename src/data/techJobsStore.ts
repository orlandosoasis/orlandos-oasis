// Lightweight in-memory store so Jobs list and Job Detail share state
// across navigations within a session. Replaces local useState(createTechServices).
import { createTechServices, type TechService, type TechServiceStatus } from "./techMockData";

type Listener = () => void;

let services: TechService[] = createTechServices();
const listeners = new Set<Listener>();

export function getJobs() {
  return services;
}

export function subscribe(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  listeners.forEach((l) => l());
}

export function updateJob(id: string, patch: Partial<TechService>) {
  services = services.map((s) => (s.id === id ? { ...s, ...patch } : s));
  emit();
}

export function setJobStatus(id: string, status: TechServiceStatus, extra: Partial<TechService> = {}) {
  updateJob(id, { status, ...extra });
}

// Photos are tracked here, keyed by job id, populated through the Messages thread.
export type JobPhoto = { id: string; src: string; type: "before" | "after"; time: string };
const photosByJob: Record<string, JobPhoto[]> = {};

export function getJobPhotos(jobId: string): JobPhoto[] {
  return photosByJob[jobId] || [];
}

export function addJobPhoto(jobId: string, photo: JobPhoto) {
  photosByJob[jobId] = [...(photosByJob[jobId] || []), photo];
  emit();
}
