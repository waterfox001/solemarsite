import type { Customer, Reservation, Vehicle } from "./types";
import { seedCustomers, seedReservations, seedVehicles } from "./seed";

const KEY = "solemar.db.v1";

interface DB {
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
}

const fresh = (): DB => ({
  vehicles: structuredClone(seedVehicles),
  customers: structuredClone(seedCustomers),
  reservations: structuredClone(seedReservations),
});

let memory: DB | null = null;

export function readDB(): DB {
  if (typeof window === "undefined") {
    memory ??= fresh();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      const initial = fresh();
      window.localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as Partial<DB>;
    return {
      vehicles: parsed.vehicles ?? [],
      customers: parsed.customers ?? [],
      reservations: parsed.reservations ?? [],
    };
  } catch {
    return fresh();
  }
}

export function writeDB(db: DB) {
  memory = db;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(db));
  }
}

export function resetDB() {
  writeDB(fresh());
}

export const uid = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
