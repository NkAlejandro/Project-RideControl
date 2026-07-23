import {
  ref,
  update,
  onValue,
  serverTimestamp,
  type DatabaseReference,
} from "firebase/database";
import { getFirebaseDatabase, getFirebaseAuth } from "@/lib/firebase";
import { db } from "@/database/db";
import { useAppStore } from "@/store/use-app-store";
import { toDate } from "@/lib/utils";
import { toast } from "sonner";

const COLLECTIONS = [
  "profiles",
  "vehicles",
  "dailyEntries",
  "fuelRecords",
  "maintenanceItems",
  "wallets",
  "goals",
  "settings",
  "transactions",
  "budgets",
  "distributionHistory",
] as const;

let currentUnsubscribe: (() => void) | null = null;
let isWriting = false;

function getDeviceId(): string {
  let id = localStorage.getItem("rc-device-id");
  if (!id) {
    id = crypto.randomUUID().slice(0, 8);
    localStorage.setItem("rc-device-id", id);
  }
  return id;
}

function getCurrentUid(): string | null {
  return getFirebaseAuth()?.currentUser?.uid ?? null;
}

export function hydrateDates(items: Record<string, unknown>[], dateFields: string[]): Record<string, unknown>[] {
  return items.map((item) => {
    const copy = { ...item };
    for (const field of dateFields) {
      const val = copy[field];
      const d = toDate(val);
      if (d) copy[field] = d;
    }
    return copy;
  });
}

const DATE_FIELDS = ["createdAt", "updatedAt", "lastDate", "date", "deadline"];

function sanitizeForFirebase(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === "object") {
    if (Array.isArray(data)) {
      return data.map(sanitizeForFirebase);
    }
    if (data instanceof Date) return data.toISOString();
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (v === undefined) continue;
      const s = sanitizeForFirebase(v);
      if (s !== undefined) result[k] = s;
    }
    return result;
  }
  if (typeof data === "number" && !isFinite(data)) return 0;
  return data;
}

async function buildPayload(): Promise<Record<string, unknown[]>> {
  const results: Record<string, unknown[]> = {};
  for (const key of COLLECTIONS) {
    results[key] = sanitizeForFirebase(await (db as any)[key].toArray()) as unknown[];
  }
  return results;
}

export async function pushToFirebase(): Promise<boolean> {
  if (isWriting) return false;
  const dbRealtime = getFirebaseDatabase();
  if (!dbRealtime) return false;
  const path = getCurrentUid();
  if (!path) return false;

  isWriting = true;
  try {
    const data = await buildPayload();

    const updates: Record<string, unknown> = {};
    for (const key of COLLECTIONS) {
      updates[`sync/${path}/${key}`] = data[key] || [];
    }
    updates[`sync/${path}/_deviceId`] = getDeviceId();
    updates[`sync/${path}/_ts`] = serverTimestamp();

    await update(ref(dbRealtime), updates);
    window.dispatchEvent(new CustomEvent("db-synced"));
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("pushToFirebase failed:", msg, e);
    toast.error(`Error de sincronización: ${msg}`);
    return false;
  } finally {
    isWriting = false;
  }
}

function toArray(v: unknown): Record<string, unknown>[] {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return Object.values(v as Record<string, unknown>) as Record<string, unknown>[];
}

async function writeToLocal(val: Record<string, unknown>) {
  const entries: [string, keyof typeof db][] = [
    ["profiles", "profiles"],
    ["vehicles", "vehicles"],
    ["dailyEntries", "dailyEntries"],
    ["fuelRecords", "fuelRecords"],
    ["maintenanceItems", "maintenanceItems"],
    ["wallets", "wallets"],
    ["goals", "goals"],
    ["settings", "settings"],
    ["transactions", "transactions"],
    ["budgets", "budgets"],
    ["distributionHistory", "distributionHistory"],
  ];
  for (const [key, table] of entries) {
    const items = toArray(val[key]);
    await (db as any)[table].clear();
    await (db as any)[table].bulkPut(hydrateDates(items, DATE_FIELDS) as never[]);
  }

  window.dispatchEvent(new CustomEvent("db-synced"));

  const store = useAppStore.getState();
  const profilesArr = toArray(val.profiles);
  const vehiclesArr = toArray(val.vehicles);
  const settingsArr = toArray(val.settings);
  if (profilesArr.length > 0) store.setProfile(profilesArr[0] as never);
  if (vehiclesArr.length > 0) store.setVehicles(vehiclesArr as never);
  if (settingsArr.length > 0) store.setSettings(settingsArr[0] as never);
}

export function startListening(uid: string): void {
  stopListening();
  const dbRealtime = getFirebaseDatabase();
  if (!dbRealtime) return;
  const nodeRef: DatabaseReference = ref(dbRealtime, `sync/${uid}`);
  currentUnsubscribe = onValue(nodeRef, async (snapshot) => {
    if (isWriting) return;
    const val = snapshot.val();
    if (!val) return;
    if (Object.keys(val).every((k) => k.startsWith("_"))) return;
    try {
      await writeToLocal(val);
    } catch (e) {
      console.error("writeToLocal failed:", e);
    }
  });
}

export function stopListening(): void {
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }
}

let pushTimeout: ReturnType<typeof setTimeout> | null = null;

export function pushSync() {
  if (pushTimeout) clearTimeout(pushTimeout);
  pushTimeout = setTimeout(() => {
    pushToFirebase();
  }, 1000);
}
