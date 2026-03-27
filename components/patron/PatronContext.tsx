"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

export interface PatronData {
  name: string;
  email?: string;
  phone?: string;
  cardNumber: string;
  holdItems?: number;
  overdueItems?: number;
  chargedItems?: number;
  fineItems?: number;
  feeAmount?: string;
}

interface PatronContextValue {
  patron: PatronData | null;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
  login: (cardNumber: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
}

const PatronContext = createContext<PatronContextValue | null>(null);

export function usePatron() {
  const ctx = useContext(PatronContext);
  if (!ctx) throw new Error("usePatron must be used inside PatronProvider");
  return ctx;
}

export function PatronProvider({ children }: { children: ReactNode }) {
  const [patron, setPatron] = useState<PatronData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Check session on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/patron/login", { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated) {
            setPatron({
              name: data.patron.name,
              email: data.patron.email,
              cardNumber: data.patron.cardNumber,
            });
          }
        }
      } catch {
        // Not logged in
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (cardNumber: string, pin: string): Promise<boolean> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const res = await fetch("/api/patron/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardNumber, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return false;
      }
      setPatron(data.patron);
      setShowLoginModal(false);
      return true;
    } catch {
      setError("Unable to connect. Please try again.");
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/patron/login", { method: "DELETE" });
    } catch {
      // Best effort
    }
    setPatron(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!patron) return;
    try {
      const res = await fetch("/api/patron/login", { method: "GET" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          setPatron({
            name: data.patron.name,
            email: data.patron.email,
            cardNumber: data.patron.cardNumber,
          });
        }
      }
    } catch {
      // Silently fail
    }
  }, [patron]);

  return (
    <PatronContext.Provider
      value={{
        patron,
        isLoading,
        isLoggingIn,
        error,
        login,
        logout,
        refresh,
        showLoginModal,
        setShowLoginModal,
      }}
    >
      {children}
    </PatronContext.Provider>
  );
}
