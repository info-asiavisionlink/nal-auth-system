"use client";

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
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="min-w-0 flex-1">
          <span className="sr-only">ツールを検索</span>
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="ツール名・説明・タグで検索"
            className="neon-ring w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm placeholder:text-slate-400"
          />
        </label>
        <label className="w-full sm:w-52">
          <span className="sr-only">カテゴリで絞り込み</span>
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="neon-ring w-full rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm"
          >
            <option value="">すべてのカテゴリ</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-sm text-slate-600">
        {resultCount} 件表示（全 {totalCount} 件）
      </p>
    </div>
  );
}
