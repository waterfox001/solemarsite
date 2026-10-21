import type { CatalogAdditional, Customer, Reservation, Vehicle } from "./types";
import { seedAdditionals, seedCustomers, seedReservations, seedVehicles } from "./seed";

const KEY = "solemar.db.v5";
const PREV_KEYS = ["solemar.db.v4", "solemar.db.v3", "solemar.db.v2", "solemar.db.v1"];

export interface DB {
  vehicles: Vehicle[];
  customers: Customer[];
  reservations: Reservation[];
  additionals: CatalogAdditional[];
}

const fresh = (): DB => ({
  vehicles: structuredClone(seedVehicles),
  customers: structuredClone(seedCustomers),
  reservations: structuredClone(seedReservations),
  additionals: structuredClone(seedAdditionals),
});

let memory: DB | null = null;

function normalizeVehicle(v: Vehicle): Vehicle {
  let category = v.category;
  if (category === "Sedan") category = "Sedã";

  let name = v.name;
  if (name.includes("Citroen")) name = name.replace("Citroen", "Citroën");

  return {
    ...v,
    category,
    name,
    fleet_quantity: v.fleet_quantity !== undefined ? Math.max(1, Number(v.fleet_quantity)) : 1,
    deposit_amount: v.deposit_amount !== undefined ? Number(v.deposit_amount) : 0,
  };
}

export function readDB(): DB {
  if (typeof window === "undefined") {
    memory ??= fresh();
    return memory;
  }
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      // Verifica se há dados de versões anteriores para preservar eventuais preços, cadastros ou alterações feitas no painel
      let migratedVehicles = structuredClone(seedVehicles);
      let migratedCustomers = structuredClone(seedCustomers);
      let migratedReservations = structuredClone(seedReservations);
      let migratedAdditionals = structuredClone(seedAdditionals);

      for (const prevKey of PREV_KEYS) {
        const prevRaw = window.localStorage.getItem(prevKey);
        if (prevRaw) {
          try {
            const prevParsed = JSON.parse(prevRaw) as Partial<DB>;
            if (Array.isArray(prevParsed.vehicles) && prevParsed.vehicles.length > 0) {
              migratedVehicles = seedVehicles.map((seedV) => {
                const userV = prevParsed.vehicles?.find((v) => v.id === seedV.id);
                if (!userV) return normalizeVehicle(seedV);
                return normalizeVehicle({
                  ...seedV,
                  ...userV,
                  category: userV.category === "Sedan" ? "Sedã" : userV.category || seedV.category,
                  cover_image: userV.cover_image || seedV.cover_image,
                  images: userV.images && userV.images.length > 0 ? userV.images : seedV.images,
                  is_illustrative_image: userV.cover_image ? false : seedV.is_illustrative_image,
                  fleet_quantity:
                    userV.fleet_quantity !== undefined
                      ? userV.fleet_quantity
                      : (seedV.fleet_quantity ?? 1),
                  deposit_amount:
                    userV.deposit_amount !== undefined
                      ? userV.deposit_amount
                      : (seedV.deposit_amount ?? 0),
                });
              });
            }
            if (Array.isArray(prevParsed.customers) && prevParsed.customers.length > 0) {
              migratedCustomers = prevParsed.customers;
            }
            if (Array.isArray(prevParsed.reservations) && prevParsed.reservations.length > 0) {
              migratedReservations = prevParsed.reservations;
            }
            if (Array.isArray(prevParsed.additionals) && prevParsed.additionals.length > 0) {
              migratedAdditionals = prevParsed.additionals;
            }
          } catch {
            // ignora erro de parse da versão anterior
          }
          break;
        }
      }

      // Limpa chaves anteriores
      for (const k of PREV_KEYS) {
        window.localStorage.removeItem(k);
      }

      const initial: DB = {
        vehicles: migratedVehicles.map(normalizeVehicle),
        customers: migratedCustomers,
        reservations: migratedReservations,
        additionals: migratedAdditionals,
      };
      window.localStorage.setItem(KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw) as Partial<DB>;

    const vehiclesWithPhotos = (parsed.vehicles ?? []).map((v) => {
      const match = seedVehicles.find((s) => s.id === v.id);
      let item = { ...v };
      if (match && (!item.images || item.images.length === 0)) {
        item = {
          ...item,
          cover_image: item.cover_image || match.cover_image,
          images: match.images,
          is_illustrative_image: item.cover_image ? false : match.is_illustrative_image,
        };
      }
      return normalizeVehicle(item);
    });

    return {
      vehicles: vehiclesWithPhotos.length > 0 ? vehiclesWithPhotos : structuredClone(seedVehicles),
      customers: parsed.customers ?? structuredClone(seedCustomers),
      reservations: parsed.reservations ?? structuredClone(seedReservations),
      additionals:
        Array.isArray(parsed.additionals) && parsed.additionals.length > 0
          ? parsed.additionals
          : structuredClone(seedAdditionals),
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

export { daysBetween } from "./format";
