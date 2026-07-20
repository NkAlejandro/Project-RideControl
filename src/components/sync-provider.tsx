import { useEffect } from "react";
import { useAuth } from "@/components/auth-provider";
import { startListening, stopListening } from "@/lib/firebase-sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      stopListening();
      return;
    }
    startListening(user.uid);
    return () => stopListening();
  }, [user]);

  return <>{children}</>;
}
