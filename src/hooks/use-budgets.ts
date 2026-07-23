import { useLiveQuery } from "dexie-react-hooks";
import { budgetRepository } from "@/database/repositories/budget-repository";
import { useAppStore } from "@/store/use-app-store";
import { useTransactions } from "./use-transactions";
import type { TransactionCategory } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

export function useBudgets(month: number, year: number) {
  const profile = useAppStore((s) => s.profile);
  const budgets = useLiveQuery(
    () => (profile ? budgetRepository.getByMonth(profile.id, month, year) : Promise.resolve([])),
    [profile, month, year],
    [],
  );
  return { budgets, loading: budgets === undefined };
}

export function useBudgetSpending(month: number, year: number) {
  const { transactions } = useTransactions();
  const { budgets } = useBudgets(month, year);

  const spending: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;
  const limits: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;

  for (const cat of EXPENSE_CATEGORIES) {
    spending[cat] = 0;
    limits[cat] = 0;
  }

  for (const t of transactions) {
    if (t.type === "expense") {
      const d = new Date(t.date);
      if (d.getMonth() + 1 === month && d.getFullYear() === year) {
        spending[t.category] = (spending[t.category] || 0) + t.amount;
      }
    }
  }

  for (const b of budgets) {
    limits[b.category] = b.monthlyLimit;
  }

  const totalSpent = Object.values(spending).reduce((s, v) => s + v, 0);
  const totalBudget = Object.values(limits).reduce((s, v) => s + v, 0);

  return { spending, limits, totalSpent, totalBudget };
}
