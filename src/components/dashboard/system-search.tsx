"use client";

import { useLanguage } from "@/contexts/LanguageContext";

type SystemSearchProps = {
  query: string;
  category: string;
  categories: string[];
  onQueryChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
};

export function SystemSearch({
  query,
  category,
  categories,
  onQueryChange,
  onCategoryChange,
  resultCount,
  totalCount,
}: SystemSearchProps) {
  const { translate } = useLanguage();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">{translate("searchTools")}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={translate("searchPlaceholder")}
            className="neon-ring w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
          />
        </label>
        <label className="w-full sm:w-52">
          <span className="sr-only">{translate("filterByCategory")}</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="neon-ring w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
          >
            <option value="">{translate("allCategories")}</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-slate-600">
        {translate("resultCount", { count: resultCount, total: totalCount })}
      </p>
    </div>
  );
}
