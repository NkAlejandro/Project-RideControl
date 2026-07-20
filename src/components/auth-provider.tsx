import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string>;
  signup: (email: string, password: string) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => "",
  signup: async () => "",
  logout: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string): Promise<string> => {
    const auth = getFirebaseAuth();
    if (!auth) return "Firebase no configurado";
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return "";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al iniciar sesión";
      if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("user-not-found")) {
        return "Correo o contraseña incorrectos";
      }
      if (msg.includes("too-many-requests")) {
        return "Demasiados intentos. Intenta más tarde";
      }
      return msg;
    }
  };

  const signup = async (email: string, password: string): Promise<string> => {
    const auth = getFirebaseAuth();
    if (!auth) return "Firebase no configurado";
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return "";
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear cuenta";
      if (msg.includes("email-already-in-use")) {
        return "Este correo ya está registrado";
      }
      if (msg.includes("weak-password")) {
        return "La contraseña debe tener al menos 6 caracteres";
      }
      if (msg.includes("invalid-email")) {
        return "Correo electrónico inválido";
      }
      return msg;
    }
  };

  const logout = async () => {
    const auth = getFirebaseAuth();
    if (auth) await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
