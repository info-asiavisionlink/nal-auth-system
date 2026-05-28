"use client";

import { LanguageSelect } from "@/components/common/LanguageSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Language } from "@/lib/i18n/types";

export function DashboardLanguageSwitcher() {
  const { language, setLanguage, updating, translate } = useLanguage();

  async function handleChange(next: Language) {
    if (next === language || updating) return;
    await setLanguage(next);
  }

  return (
    <LanguageSelect
      value={language}
      onChange={handleChange}
      disabled={updating}
      label={translate("language")}
      className="w-full sm:w-auto"
      id="dashboard-language-select"
    />
  );
}
