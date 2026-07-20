import {
  format,
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  subDays,
  subMonths,
  isToday,
  isYesterday,
  differenceInDays,
  addDays,
  addMonths,
} from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: Date, pattern = "dd MMM yyyy"): string {
  return format(date, pattern, { locale: es });
}

export function formatTime(date: Date): string {
  return format(date, "HH:mm");
}

export function formatRelative(date: Date): string {
  if (isToday(date)) return "Hoy";
  if (isYesterday(date)) return "Ayer";
  return formatDate(date, "dd MMM");
}

export function getTodayRange() {
  const start = startOfDay(new Date());
  const end = endOfDay(new Date());
  return { start, end };
}

export function getWeekRange() {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return { start, end };
}

export function getMonthRange() {
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  return { start, end };
}

export function getYearRange() {
  const start = startOfYear(new Date());
  const end = endOfYear(new Date());
  return { start, end };
}

export function getDaysAgo(days: number): Date {
  return subDays(new Date(), days);
}

export function getMonthsAgo(months: number): Date {
  return subMonths(new Date(), months);
}

export function daysBetween(a: Date, b: Date): number {
  return Math.abs(differenceInDays(a, b));
}

export function addDaysToDate(days: number): Date {
  return addDays(new Date(), days);
}

export function addMonthsToDate(months: number): Date {
  return addMonths(new Date(), months);
}

export { isToday, isYesterday, startOfDay, endOfDay };
