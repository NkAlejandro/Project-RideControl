import { useLiveQuery } from "dexie-react-hooks";
import { transactionRepository } from "@/database/repositories/transaction-repository";
import { useAppStore } from "@/store/use-app-store";

export function useTransactions() {
  const profile = useAppStore((s) => s.profile);
  const transactions = useLiveQuery(
    () => (profile ? transactionRepository.getByProfile(profile.id) : Promise.resolve([])),
    [profile],
    [],
  );
  return { transactions, loading: transactions === undefined };
}

export function useMonthlyTotals(month: number, year: number) {
  const profile = useAppStore((s) => s.profile);
  const totals = useLiveQuery(
    () => (profile ? transactionRepository.getMonthlyTotals(profile.id, month, year) : Promise.resolve({ income: 0, expenses: 0 })),
    [profile, month, year],
    { income: 0, expenses: 0 },
  );
  return totals;
}
