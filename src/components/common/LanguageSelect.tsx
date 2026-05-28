"use client";

import { LANGUAGE_OPTIONS } from "@/lib/i18n/types";
import type { Language } from "@/lib/i18n/types";

type LanguageSelectProps = {
  value: Language;
  onChange: (value: Language) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
};

export function LanguageSelect({
  value,
  onChange,
  disabled = false,
  label,
  className = "",
  id = "language-select",
}: LanguageSelectProps) {
  return (
    <label className={`block min-w-0 ${className}`} htmlFor={id}>
      {label ? (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-sky-600">
          {label}
        </span>
      ) : (
        <span className="sr-only">{label ?? "Language"}</span>
      )}
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value as Language)}
        className="neon-ring w-full min-w-[8.5rem] rounded-xl border border-sky-200/90 bg-white/90 px-3 py-2 text-xs font-medium text-slate-800 shadow-sm backdrop-blur-sm transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
