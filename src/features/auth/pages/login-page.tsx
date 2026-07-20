import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Bike } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Completa todos los campos");
      return;
    }
    setLoading(true);
    const error = isSignUp ? await signup(email, password) : await login(email, password);
    setLoading(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(isSignUp ? "Cuenta creada" : "Bienvenido");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring" as const, stiffness: 300, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500"
          >
            <Bike className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-2xl font-bold text-primary-color">RideControl</h1>
          <p className="mt-1 text-sm text-secondary-color">
            {isSignUp ? "Crea tu cuenta" : "Inicia sesión para sincronizar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              inputMode="email"
              autoComplete="email"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Input
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 6 caracteres"
              icon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-muted-color hover:text-primary-color"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button type="submit" className="w-full" loading={loading}>
              {isSignUp ? "Crear cuenta" : "Iniciar sesión"}
            </Button>
          </motion.div>
        </form>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm text-secondary-color hover:text-primary-color transition-colors"
          >
            {isSignUp ? "¿Ya tienes cuenta? Inicia sesión" : "¿No tienes cuenta? Créala"}
          </button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 text-center text-xs text-muted-color"
        >
          Tus datos se sincronizan automáticamente entre tus dispositivos
        </motion.p>
      </motion.div>
    </div>
  );
}
