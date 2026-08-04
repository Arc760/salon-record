"use client";

import { useEffect, useState } from "react";

export type Language = "zh" | "en";

const LANGUAGE_KEY = "salon-record-language";

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    const loadLanguage = window.setTimeout(() => {
      const savedLanguage = window.localStorage.getItem(LANGUAGE_KEY);

      if (savedLanguage === "en" || savedLanguage === "zh") {
        setLanguageState(savedLanguage);
      }
    }, 0);

    return () => window.clearTimeout(loadLanguage);
  }, []);

  function setLanguage(nextLanguage: Language) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: LANGUAGE_KEY,
        newValue: nextLanguage,
      }),
    );
  }

  return {
    language,
    setLanguage,
    locale: language === "zh" ? "zh-CN" : "en-US",
  };
}

export function LanguageSwitcher({
  language,
  setLanguage,
}: {
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
      className="shrink-0 rounded-full border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700"
    >
      {language === "zh" ? "English" : "中文"}
    </button>
  );
}
