import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CO").format(value);
}

export function toDate(v: unknown): Date | undefined {
  if (!v) return undefined;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof (v as Record<string, unknown>).toDate === "function") {
    const d = (v as { toDate(): Date }).toDate();
    return isNaN(d.getTime()) ? undefined : d;
  }
  const d = new Date(v as string | number);
  return isNaN(d.getTime()) ? undefined : d;
}
