import {
  ref,
  set,
  onValue,
  serverTimestamp,
  type DatabaseReference,
} from "firebase/database";
import { getFirebaseDatabase, getFirebaseAuth } from "@/lib/firebase";
import { db } from "@/database/db";
import { useAppStore } from "@/store/use-app-store";

interface SyncPayload {
  profiles: unknown[];
  vehicles: unknown[];
  dailyEntries: unknown[];
  fuelRecords: unknown[];
  maintenanceItems: unknown[];
  wallets: unknown[];
  goals: unknown[];
  settings: unknown[];
  updatedAt: number;
}

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

function hydrateDates(items: Record<string, unknown>[], dateFields: string[]): Record<string, unknown>[] {
  return items.map((item) => {
    const copy = { ...item };
    for (const field of dateFields) {
      const val = copy[field];
      if (typeof val === "string" || typeof val === "number") {
        const d = new Date(val as string | number);
        if (!isNaN(d.getTime())) {
          copy[field] = d;
        }
      }
    }
    return copy;
  });
}

const DATE_FIELDS = ["createdAt", "updatedAt", "lastDate", "date", "deadline"];

async function buildPayload(): Promise<SyncPayload> {
  return {
    profiles: await db.profiles.toArray(),
    vehicles: await db.vehicles.toArray(),
    dailyEntries: await db.dailyEntries.toArray(),
    fuelRecords: await db.fuelRecords.toArray(),
    maintenanceItems: await db.maintenanceItems.toArray(),
    wallets: await db.wallets.toArray(),
    goals: await db.goals.toArray(),
    settings: await db.settings.toArray(),
    updatedAt: Date.now(),
  };
}

export async function pushToFirebase(): Promise<boolean> {
  if (isWriting) return false;
  const dbRealtime = getFirebaseDatabase();
  if (!dbRealtime) return false;
  const path = getCurrentUid();
  if (!path) return false;
  try {
    isWriting = true;
    const data = await buildPayload();
    const nodeRef: DatabaseReference = ref(dbRealtime, `sync/${path}`);
    await set(nodeRef, { ...data, _deviceId: getDeviceId(), _ts: serverTimestamp() });
    return true;
  } catch {
    return false;
  } finally {
    isWriting = false;
  }
}

async function writeToLocal(val: Record<string, unknown>) {
  await db.profiles.clear();
  await db.vehicles.clear();
  await db.dailyEntries.clear();
  await db.fuelRecords.clear();
  await db.maintenanceItems.clear();
  await db.wallets.clear();
  await db.goals.clear();
  await db.settings.clear();
  if (val.profiles) await db.profiles.bulkPut(hydrateDates(val.profiles as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.vehicles) await db.vehicles.bulkPut(hydrateDates(val.vehicles as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.dailyEntries) await db.dailyEntries.bulkPut(hydrateDates(val.dailyEntries as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.fuelRecords) await db.fuelRecords.bulkPut(hydrateDates(val.fuelRecords as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.maintenanceItems) await db.maintenanceItems.bulkPut(hydrateDates(val.maintenanceItems as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.wallets) await db.wallets.bulkPut(hydrateDates(val.wallets as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.goals) await db.goals.bulkPut(hydrateDates(val.goals as Record<string, unknown>[], DATE_FIELDS) as never[]);
  if (val.settings) await db.settings.bulkPut(hydrateDates(val.settings as Record<string, unknown>[], DATE_FIELDS) as never[]);

  const store = useAppStore.getState();
  const profiles = val.profiles as Record<string, unknown>[] | undefined;
  const vehicles = val.vehicles as Record<string, unknown>[] | undefined;
  const settings = val.settings as Record<string, unknown>[] | undefined;
  if (profiles && profiles.length > 0) {
    store.setProfile(profiles[0] as never);
  }
  if (vehicles) {
    store.setVehicles(vehicles as never);
  }
  if (settings && settings.length > 0) {
    store.setSettings(settings[0] as never);
  }
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
    try {
      await writeToLocal(val);
    } catch {}
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
