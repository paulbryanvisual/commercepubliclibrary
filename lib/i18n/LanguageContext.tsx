"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { en, es, type TranslationKey } from "./translations";

type Lang = "en" | "es";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const translations = { en, es } as const;

const STORAGE_KEY = "cpl-language";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [mounted, setMounted] = useState(false);

  // Load persisted language on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "en" || stored === "es") {
        setLangState(stored);
      }
    } catch {
      // localStorage not available
    }
    setMounted(true);
  }, []);

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // localStorage not available
    }
    // Update html lang attribute
    document.documentElement.lang = newLang;
  }, []);

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] || translations.en[key] || key;
    },
    [lang]
  );

  // Update html lang attribute on mount
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
    }
  }, [lang, mounted]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
