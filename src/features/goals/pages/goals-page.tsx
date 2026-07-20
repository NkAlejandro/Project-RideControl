import { useState, useMemo, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { format, differenceInMonths, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { Resolver } from "react-hook-form";
import {
  Plus,
  Target,
  Clock,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Trash2,
  PiggyBank,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { goalSchema, type GoalFormData } from "@/lib/schemas";
import { useGoals } from "@/hooks/use-goals";
import { useAppStore } from "@/store/use-app-store";
import { cn, formatCurrency } from "@/lib/utils";

function AnimatedNumber({ value, duration = 1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = () => {
      let startTs: number | null = null;
      const tick = (now: number) => {
        if (startTs === null) startTs = now;
        const elapsed = now - startTs;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(value * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(start);
    return () => cancelAnimationFrame(raf);
  }, [value, inView, duration]);

  return <span ref={ref}>{formatCurrency(display)}</span>;
}

export default function GoalsPage() {
  const { goals, loading, create, addToGoal, remove } = useGoals();
  const profile = useAppStore((s) => s.profile);
  const [modalOpen, setModalOpen] = useState(false);
  const [addMoneyModalGoal, setAddMoneyModalGoal] = useState<string | null>(
    null,
  );
  const [addAmount, setAddAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema) as Resolver<GoalFormData>,
    defaultValues: {
      profileId: profile?.id ?? "",
      title: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: undefined,
      isCompleted: false,
    },
  });

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [goals]);

  const activeCount = goals.filter((g) => !g.isCompleted).length;
  const completedCount = goals.filter((g) => g.isCompleted).length;

  const handleOpenModal = () => {
    reset({
      profileId: profile?.id ?? "",
      title: "",
      description: "",
      targetAmount: 0,
      currentAmount: 0,
      deadline: undefined,
      isCompleted: false,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: GoalFormData) => {
    setSaving(true);
    try {
      await create({
        profileId: data.profileId,
        title: data.title,
        description: data.description,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount,
        deadline: data.deadline,
        isCompleted: false,
      });
      toast.success("Objetivo creado");
      setModalOpen(false);
      reset();
    } catch {
      toast.error("Error al crear objetivo");
    } finally {
      setSaving(false);
    }
  };

  const handleAddMoney = async (goalId: string) => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) {
      toast.error("Ingresa un monto válido");
      return;
    }
    try {
      await addToGoal(goalId, amount);
      const goal = goals.find((g) => g.id === goalId);
      if (goal && goal.currentAmount + amount >= goal.targetAmount) {
        toast.success("¡Objetivo completado!", {
          description: `${goal.title} ha sido alcanzado`,
        });
      } else {
        toast.success("Dinero agregado", {
          description: `${formatCurrency(amount)} agregado`,
        });
      }
      setAddMoneyModalGoal(null);
      setAddAmount("");
    } catch {
      toast.error("Error al agregar dinero");
    }
  };

  const handleDelete = async (goalId: string, title: string) => {
    try {
      await remove(goalId);
      toast.success(`"${title}" eliminado`);
    } catch {
      toast.error("Error al eliminar");
    }
  };

  function getGoalStats(goal: (typeof goals)[0]) {
    const percentage = Math.min(
      100,
      (goal.currentAmount / goal.targetAmount) * 100,
    );
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

    if (!goal.deadline || goal.isCompleted) {
      return { percentage, remaining, monthsNeeded: null, monthlyNeeded: null, daysLeft: null };
    }

    const deadlineDate = new Date(goal.deadline);
    const now = new Date();
    const daysLeft = Math.max(0, differenceInDays(deadlineDate, now));
    const monthsLeft = Math.max(1, differenceInMonths(deadlineDate, now));
    const monthlyNeeded = remaining > 0 ? remaining / monthsLeft : 0;

    return {
      percentage,
      remaining,
      monthsNeeded: monthsLeft,
      monthlyNeeded,
      daysLeft,
    };
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary-color">Objetivos</h1>
          <p className="text-sm text-secondary-color">Tus metas financieras</p>
        </div>
        <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
          <Button size="sm" onClick={handleOpenModal} className="btn-ripple press-effect">
            <Plus className="h-4 w-4" />
            Crear meta
          </Button>
        </motion.div>
      </div>

      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { val: goals.length, cls: "text-primary-color", label: "Total" },
            { val: activeCount, cls: "text-primary-400", label: "Activos" },
            { val: completedCount, cls: "text-success-400", label: "Completados" },
          ].map((item, idx) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: "spring" as const,
                stiffness: 200,
                damping: 18,
                delay: idx * 0.08,
              }}
            >
              <Card padding="sm" className="text-center hover-lift">
                <p className={cn("text-2xl font-bold", item.cls)}>{item.val}</p>
                <p className="text-[10px] uppercase tracking-wider text-secondary-color">{item.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-3xl bg-hover"
            />
          ))}
        </div>
      ) : sortedGoals.length > 0 ? (
        <div className="space-y-3">
          <AnimatePresence>
            {sortedGoals.map((goal, idx) => {
              const stats = getGoalStats(goal);
              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -100, scale: 0.9 }}
                  transition={{
                    delay: idx * 0.08,
                    type: "spring" as const,
                    stiffness: 200,
                    damping: 18,
                  }}
                >
                  <Card
                    padding="md"
                    className={cn(
                      "card-interactive hover-lift",
                      goal.isCompleted
                        ? "border border-success-500/20 bg-success-500/10"
                        : "border border-theme-subtle bg-card",
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <motion.div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-2xl",
                            goal.isCompleted
                              ? "bg-success-500/20"
                              : "bg-primary-500/10",
                          )}
                          {...(goal.isCompleted
                            ? {
                                animate: {
                                  scale: [1, 1.2, 1],
                                },
                                transition: {
                                  duration: 0.6,
                                  type: "spring" as const,
                                  stiffness: 300,
                                },
                              }
                            : {})}
                        >
                          {goal.isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-success-400" />
                          ) : (
                            <Target className="h-5 w-5 text-primary-400" />
                          )}
                        </motion.div>
                        <div>
                          <h3 className="text-sm font-medium text-primary-color">
                            {goal.title}
                          </h3>
                          {goal.description && (
                            <p className="text-xs text-secondary-color">
                              {goal.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {!goal.isCompleted && (
                        <button
                          onClick={() => handleDelete(goal.id, goal.title)}
                          className="rounded-xl p-1.5 text-muted-color transition-colors hover:bg-danger-500/10 hover:text-danger-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mb-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-xs text-secondary-color">
                          {formatCurrency(goal.currentAmount)} de{" "}
                          {formatCurrency(goal.targetAmount)}
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold",
                            goal.isCompleted
                              ? "text-success-400"
                              : "text-primary-400",
                          )}
                        >
                          {stats.percentage.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-1 overflow-hidden rounded-full bg-hover">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.percentage}%` }}
                          transition={{
                            delay: 0.15 + idx * 0.1,
                            duration: 0.8,
                            ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
                          }}
                          className={cn(
                            "h-full rounded-full progress-animated",
                            goal.isCompleted
                              ? "bg-success-500"
                              : "bg-primary-500",
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-[10px] text-secondary-color">
                      {!goal.isCompleted && stats.remaining > 0 && (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          <AnimatedNumber value={stats.remaining} duration={0.8} /> restante
                        </span>
                      )}
                      {stats.daysLeft !== null && !goal.isCompleted && (
                        <motion.span
                          className="flex items-center gap-1"
                          animate={{
                            opacity: [0.7, 1, 0.7],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                        >
                          <Clock className="h-3 w-3" />
                          {stats.daysLeft} días restantes
                        </motion.span>
                      )}
                      {stats.monthlyNeeded !== null &&
                        !goal.isCompleted &&
                        stats.monthlyNeeded > 0 && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            <AnimatedNumber value={stats.monthlyNeeded} duration={0.8} />/mes
                          </span>
                        )}
                      {goal.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Meta:{" "}
                          {format(new Date(goal.deadline), "dd MMM yyyy", {
                            locale: es,
                          })}
                        </span>
                      )}
                    </div>

                    {!goal.isCompleted && (
                      <div className="mt-3 flex gap-2">
                        <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="w-full btn-ripple"
                            onClick={() => {
                              setAddMoneyModalGoal(goal.id);
                              setAddAmount("");
                            }}
                          >
                            <PiggyBank className="h-3.5 w-3.5" />
                            Agregar dinero
                          </Button>
                        </motion.div>
                      </div>
                    )}

                    {goal.isCompleted && (
                      <motion.div
                        className="mt-3 flex items-center gap-2 rounded-2xl bg-success-500/10 px-3 py-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          type: "spring" as const,
                          stiffness: 300,
                          damping: 12,
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.3, 1],
                          }}
                          transition={{
                            duration: 0.5,
                            type: "spring" as const,
                          }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-success-400" />
                        </motion.div>
                        <span className="text-xs font-medium text-success-400">
                          Objetivo completado
                        </span>
                      </motion.div>
                    )}
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring" as const, stiffness: 200, damping: 15 }}
        >
          <Card className="py-12 text-center">
            <Target className="mx-auto mb-3 h-12 w-12 text-muted-color" />
            <p className="text-sm text-secondary-color">No tienes objetivos aún</p>
            <p className="mb-4 text-xs text-secondary-color">
              Crea una meta y la app calculará todo automáticamente
            </p>
            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }}>
              <Button size="sm" onClick={handleOpenModal} className="btn-ripple press-effect">
                <Plus className="h-4 w-4" />
                Crear primera meta
              </Button>
            </motion.div>
          </Card>
        </motion.div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Crear objetivo"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-1.5">
          <input type="hidden" {...register("profileId")} />

          <Input
            label="Título"
            placeholder="Ej: Comprar Yamaha R15"
            error={errors.title?.message}
            {...register("title")}
          />

          <div>
            <textarea
              {...register("description")}
              placeholder="Descripción (opcional)"
              rows={1}
              className="flex w-full resize-none rounded-xl border border-theme-subtle bg-input px-4 py-2.5 text-xs text-primary-color placeholder-muted-color transition-colors focus:border-primary-500/50 focus:outline-none focus:ring-1 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Input
              label="Monto objetivo"
              type="number"
              step="100000"
              placeholder="0"
              icon={<DollarSign className="h-3.5 w-3.5" />}
              error={errors.targetAmount?.message}
              {...register("targetAmount", { valueAsNumber: true })}
            />
            <Input
              label="Monto inicial"
              type="number"
              step="10000"
              placeholder="0"
              icon={<DollarSign className="h-3.5 w-3.5" />}
              error={errors.currentAmount?.message}
              {...register("currentAmount", { valueAsNumber: true })}
            />
          </div>

          <Input
            label="Fecha límite"
            type="date"
            error={errors.deadline?.message}
            {...register("deadline", { valueAsDate: true })}
          />

          <div className="flex gap-1.5 pt-0.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="flex-1" loading={saving}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={addMoneyModalGoal !== null}
        onClose={() => {
          setAddMoneyModalGoal(null);
          setAddAmount("");
        }}
        title="Agregar dinero"
      >
        <div className="space-y-3">
          {(() => {
            const goal = goals.find((g) => g.id === addMoneyModalGoal);
            if (!goal) return null;
            const stats = getGoalStats(goal);
            return (
              <>
                <div className="rounded-2xl bg-hover p-3">
                  <p className="text-sm font-medium text-primary-color">
                    {goal.title}
                  </p>
                  <p className="text-xs text-secondary-color">
                    {formatCurrency(goal.currentAmount)} de{" "}
                    {formatCurrency(goal.targetAmount)} ({stats.percentage.toFixed(0)}%)
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-400">
                    <motion.div
                      className="h-full rounded-full bg-primary-500 progress-animated"
                      initial={{ width: 0 }}
                      animate={{ width: `${stats.percentage}%` }}
                      transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
                    />
                  </div>
                </div>

                <Input
                  label="Monto a agregar"
                  type="number"
                  step="10000"
                  placeholder="0"
                  icon={<DollarSign className="h-4 w-4" />}
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                />

                {addAmount && parseFloat(addAmount) > 0 && (
                  <div className="rounded-2xl bg-hover p-3">
                    <p className="text-xs text-secondary-color">Después de agregar</p>
                    <p className="text-sm font-medium text-primary-color">
                      {formatCurrency(
                        goal.currentAmount + parseFloat(addAmount),
                      )}{" "}
                      / {formatCurrency(goal.targetAmount)} (
                      {Math.min(
                        100,
                        ((goal.currentAmount + parseFloat(addAmount)) /
                          goal.targetAmount) *
                          100,
                      ).toFixed(0)}
                      %)
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => {
                      setAddMoneyModalGoal(null);
                      setAddAmount("");
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => {
                      if (addMoneyModalGoal) handleAddMoney(addMoneyModalGoal);
                    }}
                    disabled={!addAmount || parseFloat(addAmount) <= 0}
                  >
                    Agregar
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      </Modal>
    </div>
  );
}
