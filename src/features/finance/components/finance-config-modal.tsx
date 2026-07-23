import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Percent } from "lucide-react";
import { useWallets } from "@/hooks/use-wallets";
import { walletRepository } from "@/database/repositories/wallet-repository";
import { WALLET_TYPES, WALLET_LABELS, WALLET_DESCRIPTIONS, WALLET_COLORS, type PercentagesInput } from "@/lib/finance-engine";
import { usePlatform } from "@/hooks/use-platform";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function FinanceConfigModal({ open, onClose }: Props) {
  const { wallets, loading } = useWallets();
  const { isAndroid } = usePlatform();
  const [percentages, setPercentages] = useState<PercentagesInput>({
    moto: 30,
    ahorro: 40,
    inversiones: 20,
    personales: 10,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (wallets.length > 0) {
      setPercentages({
        moto: wallets.find((w) => w.type === "moto")?.percentage ?? 30,
        ahorro: wallets.find((w) => w.type === "ahorro")?.percentage ?? 40,
        inversiones: wallets.find((w) => w.type === "inversiones")?.percentage ?? 20,
        personales: wallets.find((w) => w.type === "personales")?.percentage ?? 10,
      });
    }
  }, [wallets]);

  const isValid = percentages.moto + percentages.ahorro + percentages.inversiones + percentages.personales === 100;

  function setPct(changed: keyof PercentagesInput, raw: number) {
    setPercentages((prev) => {
      const idx = WALLET_TYPES.indexOf(changed);
      const adjIdx = idx < 3 ? idx + 1 : idx - 1;
      const adjType = WALLET_TYPES[adjIdx];
      const unchanged = WALLET_TYPES.filter((_, i) => i !== idx && i !== adjIdx);
      const unchangedSum = unchanged.reduce((s, t) => s + prev[t], 0);
      const value = Math.min(raw, 100 - unchangedSum);
      const next = { ...prev, [changed]: value };
      next[adjType] = Math.max(0, 100 - value - unchangedSum);
      return next;
    });
  }

  async function handleSave() {
    if (!isValid) {
      toast.error("Los porcentajes deben sumar exactamente 100%");
      return;
    }
    setSaving(true);
    try {
      for (const wallet of wallets) {
        const pct = percentages[wallet.type as keyof PercentagesInput];
        if (pct !== undefined && pct !== wallet.percentage) {
          await walletRepository.update(wallet.id, { percentage: pct });
        }
      }
      toast.success("Distribución financiera actualizada");
      onClose();
    } catch {
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  const cardClass = isAndroid
    ? "w-full max-w-md bg-card p-4"
    : "w-full max-w-md rounded-2xl bg-card p-5 border border-theme-subtle shadow-2xl";

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay" onClick={onClose}>
      <div className={cardClass} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500/10">
            <Percent className="h-4 w-4 text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary-color">Configurar distribución</p>
            <p className="text-[11px] text-secondary-color">Moto · Ahorro · Inversiones · Personales</p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex h-2.5 gap-px rounded overflow-hidden">
            {WALLET_TYPES.map((type) => (
              <div key={type} style={{ width: `${percentages[type]}%`, backgroundColor: WALLET_COLORS[type] }} />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {WALLET_TYPES.map((type) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: WALLET_COLORS[type] }} />
                  <span className="text-sm text-primary-color">{WALLET_LABELS[type]}</span>
                </div>
                <span className="text-sm font-semibold text-primary-color">{percentages[type]}%</span>
              </div>
              <p className="text-[10px] text-secondary-color mb-1">{WALLET_DESCRIPTIONS[type]}</p>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={percentages[type]}
                onChange={(e) => setPct(type, parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-hover [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
              />
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl bg-hover py-2.5 text-sm font-medium text-secondary-color">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!isValid || saving} className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-on-primary disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  ) : null;
}
