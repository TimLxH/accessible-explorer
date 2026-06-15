import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { speak, stopSpeaking } from "@/lib/speech";

type EmergencyStatus = "idle" | "sharing" | "notifying" | "onway";

type EmergencyContextValue = {
  active: boolean;
  status: EmergencyStatus;
  countdown: number;
  location: { lat: number; lng: number } | null;
  contactName: string;
  contactPhone: string;
  trigger: () => void;
  dismiss: () => void;
};

const EmergencyContext = createContext<EmergencyContextValue | null>(null);

export function useEmergency() {
  const ctx = useContext(EmergencyContext);
  if (!ctx) throw new Error("useEmergency debe usarse dentro de EmergencyProvider");
  return ctx;
}

export function EmergencyProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [status, setStatus] = useState<EmergencyStatus>("idle");
  const [countdown, setCountdown] = useState(5);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  const contactName = "María Quispe";
  const contactPhone = "+51 987 654 321";

  const timersRef = useRef<number[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  const dismiss = useCallback(() => {
    clearTimers();
    setActive(false);
    setStatus("idle");
    setCountdown(5);
    try { stopSpeaking(); } catch { /* ignore */ }
  }, [clearTimers]);

  const trigger = useCallback(() => {
    if (active) return;
    try { stopSpeaking(); } catch { /* ignore */ }
    setActive(true);
    setStatus("sharing");
    setCountdown(5);
    // Ubicación simulada (Huancayo, Junín como referencia)
    setLocation({ lat: -12.0691, lng: -75.2103 });

    speak("Emergencia activada. Iniciando protocolo de asistencia.");

    // Cuenta regresiva
    for (let i = 1; i <= 5; i++) {
      const id = window.setTimeout(() => setCountdown(5 - i), i * 1000);
      timersRef.current.push(id);
    }
    // Estados secuenciales
    timersRef.current.push(window.setTimeout(() => setStatus("notifying"), 2000));
    timersRef.current.push(window.setTimeout(() => setStatus("onway"), 4500));
  }, [active]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const value = useMemo<EmergencyContextValue>(
    () => ({ active, status, countdown, location, contactName, contactPhone, trigger, dismiss }),
    [active, status, countdown, location, trigger, dismiss],
  );

  return <EmergencyContext.Provider value={value}>{children}</EmergencyContext.Provider>;
}
