import { useState } from "react";
import { Plus, X, PiggyBank } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useBudgets } from "@/hooks/use-budgets";
import { useBudgetSpending } from "@/hooks/use-budgets";
import { budgetRepository } from "@/database/repositories/budget-repository";
import { budgetSchema } from "@/lib/schemas";
import { useAppStore } from "@/store/use-app-store";
import { EXPENSE_CATEGORIES, CATEGORY_LABELS, type TransactionCategory } from "@/types";
import { formatCurrency } from "@/lib/utils";

const now = new Date();
const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function BudgetsTab() {
  const profile = useAppStore((s) => s.profile);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { budgets } = useBudgets(month, year);
  const { spending, limits, totalSpent, totalBudget } = useBudgetSpending(month, year);
  const [showForm, setShowForm] = useState(false);
  const [selectedCat, setSelectedCat] = useState<TransactionCategory>("comida");
  const [limitVal, setLimitVal] = useState("");
  const [formError, setFormError] = useState("");

  const progress = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const remaining = totalBudget - totalSpent;

  async function handleSave() {
    if (!profile) return;
    const parsed = budgetSchema.safeParse({ category: selectedCat, monthlyLimit: parseFloat(limitVal) });
    if (!parsed.success) { setFormError(parsed.error.issues[0].message); return; }
    setFormError("");
    await budgetRepository.upsert({ ...parsed.data, profileId: profile.id, month, year });
    setShowForm(false);
    setLimitVal("");
  }

  async function handleDelete(cat: TransactionCategory) {
    const b = budgets.find((b) => b.category === cat);
    if (b) await budgetRepository.delete(b.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button onClick={() => { if (month === 1) { setMonth(12); setYear(year - 1); } else setMonth(month - 1); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary-color hover:bg-hover hover:text-primary-color"
          >‹</button>
          <span className="text-sm font-medium text-primary-color min-w-[100px] text-center">{MONTHS[month - 1]} {year}</span>
          <button onClick={() => { if (month === 12) { setMonth(1); setYear(year + 1); } else setMonth(month + 1); }}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-secondary-color hover:bg-hover hover:text-primary-color"
          >›</button>
        </div>
        <button onClick={() => { setShowForm(true); setLimitVal(""); setSelectedCat("comida"); }}
          className="flex h-8 items-center gap-1 rounded-xl bg-primary-500 px-3 text-xs font-medium text-on-primary"
        ><Plus className="h-3.5 w-3.5" /> Presupuesto</button>
      </div>

      {totalBudget > 0 && (
        <div className="rounded-xl bg-card p-4 border border-theme-subtle">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs text-secondary-color">Presupuesto total</span>
            <span className="text-xs text-secondary-color">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
          </div>
          <div className="h-2.5 rounded-full bg-hover overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${remaining >= 0 ? "bg-success-500" : "bg-danger-500"}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`mt-1 text-xs ${remaining >= 0 ? "text-success-500" : "text-danger-500"}`}>
            {remaining >= 0 ? `Te quedan ${formatCurrency(remaining)}` : `Excediste por ${formatCurrency(Math.abs(remaining))}`}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-xl bg-card p-4 border border-theme-subtle space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-color">Nuevo presupuesto</span>
              <button onClick={() => setShowForm(false)} className="text-muted-color hover:text-primary-color">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setSelectedCat(cat)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium text-left transition-colors ${selectedCat === cat ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "bg-hover text-secondary-color border border-transparent"}`}
                >
                  {CATEGORY_LABELS[cat]}
                  {limits[cat] > 0 && <span className="ml-1 text-[10px] text-muted-color">({formatCurrency(limits[cat])})</span>}
                </button>
              ))}
            </div>
            <input type="number" step="0.01" min="1" value={limitVal} onChange={(e) => setLimitVal(e.target.value)}
              placeholder="Límite mensual" className="h-9 w-full rounded-xl border border-theme-subtle bg-input px-3 text-sm text-primary-color placeholder:text-muted-color outline-none"
            />
            {formError && <p className="text-xs text-danger-500">{formError}</p>}
            <button onClick={handleSave}
              className="w-full rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-on-primary"
            >Guardar presupuesto</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-2">
        {EXPENSE_CATEGORIES.map((cat) => {
          const spent = spending[cat] || 0;
          const limit = limits[cat] || 0;
          const hasBudget = limit > 0;
          const pct = hasBudget ? Math.min((spent / limit) * 100, 100) : 0;
          return (
            <div key={cat} className="rounded-xl bg-card p-3 border border-theme-subtle">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-primary-color truncate">{CATEGORY_LABELS[cat]}</span>
                  {hasBudget && (
                    <span className="shrink-0 rounded-full bg-hover px-1.5 py-0.5 text-[10px] text-muted-color">
                      {formatCurrency(limit)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className={`text-xs font-medium ${hasBudget && spent > limit ? "text-danger-500" : "text-secondary-color"}`}>
                    {formatCurrency(spent)}
                  </span>
                  {hasBudget && (
                    <button onClick={() => handleDelete(cat)} className="text-muted-color hover:text-danger-500">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
              {hasBudget && (
                <div className="h-1.5 rounded-full bg-hover overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${spent > limit ? "bg-danger-500" : spent > limit * 0.8 ? "bg-warning-500" : "bg-success-500"}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              {!hasBudget && (
                <button onClick={() => { setSelectedCat(cat); setLimitVal(""); setShowForm(true); }}
                  className="mt-1 text-xs text-primary-500 hover:text-primary-400"
                >+ Fijar presupuesto</button>
              )}
            </div>
          );
        })}
      </div>

      {budgets.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <PiggyBank className="mb-3 h-12 w-12 text-muted-color" />
          <p className="text-sm font-medium text-primary-color">Sin presupuestos</p>
          <p className="mt-1 text-xs text-muted-color">Fija límites mensuales por categoría para controlar tus gastos</p>
        </div>
      )}
    </div>
  );
}
