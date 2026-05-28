"use client";

import { useMemo, useState, useTransition } from "react";
import { SystemCard } from "@/components/dashboard/system-card";
import { SystemSearch } from "@/components/dashboard/system-search";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslatedTools } from "@/lib/translation/use-translated-tools";
import { createClient } from "@/lib/supabase";
import type { OpenToolUserContext } from "@/lib/open-tool";
import type { Tool } from "@/types/tool";

type SystemLibraryProps = {
  /** Googleスプレッドシート由来の元データ（起動・フィルタ用） */
  originalTools: Tool[];
  initialFavoriteIds: string[];
  userId: string;
  openToolUser: OpenToolUserContext;
  error: string | null;
};

function matchesQuery(tool: Tool, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const tagText = tool.tags.join(" ").toLowerCase();

  return (
    tool.tool_name.toLowerCase().includes(normalized) ||
    tool.description.toLowerCase().includes(normalized) ||
    tagText.includes(normalized)
  );
}

function sortTools(tools: Tool[], favoriteIds: Set<string>): Tool[] {
  return [...tools].sort((a, b) => {
    const aFav = favoriteIds.has(a.tool_id) ? 0 : 1;
    const bFav = favoriteIds.has(b.tool_id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.sort_order - b.sort_order;
  });
}

export function SystemLibrary({
  originalTools,
  initialFavoriteIds,
  userId,
  openToolUser,
  error,
}: SystemLibraryProps) {
  const { language, translate, ready } = useLanguage();
  const { translatedTools, translating } = useTranslatedTools(
    originalTools,
    language,
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(initialFavoriteIds),
  );
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [pendingToolId, setPendingToolId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const originalToolsById = useMemo(
    () => new Map(originalTools.map((tool) => [tool.tool_id, tool])),
    [originalTools],
  );

  const categoryOptions = useMemo(() => {
    const unique = new Set(
      originalTools.map((tool) => tool.category).filter(Boolean),
    );
    const sorted = [...unique].sort((a, b) => a.localeCompare(b, "ja"));
    const labelBySourceCategory = new Map<string, string>();

    for (const translatedTool of translatedTools) {
      const source = originalToolsById.get(translatedTool.tool_id);
      if (source?.category) {
        labelBySourceCategory.set(source.category, translatedTool.category);
      }
    }

    return sorted.map((value) => ({
      value,
      label: labelBySourceCategory.get(value) ?? value,
    }));
  }, [originalTools, originalToolsById, translatedTools]);

  const filteredTranslatedTools = useMemo(() => {
    return translatedTools.filter((translatedTool) => {
      const originalTool = originalToolsById.get(translatedTool.tool_id);
      if (!originalTool) return false;

      const categoryMatch = !category || originalTool.category === category;
      return categoryMatch && matchesQuery(translatedTool, query);
    });
  }, [translatedTools, originalToolsById, category, query]);

  const sortedTranslatedTools = useMemo(
    () => sortTools(filteredTranslatedTools, favoriteIds),
    [filteredTranslatedTools, favoriteIds],
  );

  const openToolUserWithLang = useMemo<OpenToolUserContext>(
    () => ({ ...openToolUser, lang: language }),
    [openToolUser, language],
  );

  async function handleToggleFavorite(toolId: string) {
    if (pendingToolId) return;

    setFavoriteError(null);
    setPendingToolId(toolId);

    const supabase = createClient();
    const isFavorite = favoriteIds.has(toolId);

    try {
      if (isFavorite) {
        const { error: deleteError } = await supabase
          .from("user_favorite_tools")
          .delete()
          .eq("user_id", userId)
          .eq("tool_id", toolId);

        if (deleteError) {
          setFavoriteError(deleteError.message);
          return;
        }

        startTransition(() => {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(toolId);
            return next;
          });
        });
      } else {
        const { error: insertError } = await supabase
          .from("user_favorite_tools")
          .insert({ user_id: userId, tool_id: toolId });

        if (insertError) {
          setFavoriteError(insertError.message);
          return;
        }

        startTransition(() => {
          setFavoriteIds((prev) => new Set(prev).add(toolId));
        });
      }
    } catch {
      setFavoriteError(translate("favoriteUpdateFailed"));
    } finally {
      setPendingToolId(null);
    }
  }

  if (!ready) {
    return (
      <div className="animate-pulse space-y-4" aria-busy="true">
        <div className="h-7 w-48 rounded-lg bg-sky-100" />
        <div className="h-12 rounded-xl bg-sky-50" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-64 rounded-2xl bg-sky-50" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <p
        className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        role="alert"
      >
        {error}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="accent-heading mb-2 border-b border-sky-100 pb-3 text-lg font-semibold">
        {translate("systemLibraryTitle")}
      </h2>

      {translating ? (
        <p className="text-xs text-sky-600" role="status">
          {translate("loading")}
        </p>
      ) : null}

      <SystemSearch
        query={query}
        category={category}
        categories={categoryOptions}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        resultCount={sortedTranslatedTools.length}
        totalCount={originalTools.length}
      />

      {favoriteError ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {favoriteError}
        </p>
      ) : null}

      {sortedTranslatedTools.length === 0 ? (
        <p className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-6 text-center text-sm text-slate-600">
          {translate("noMatchingTools")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTranslatedTools.map((translatedTool) => {
            const originalTool =
              originalToolsById.get(translatedTool.tool_id) ?? translatedTool;

            return (
              <SystemCard
                key={translatedTool.tool_id}
                tool={translatedTool}
                sourceTool={originalTool}
                openToolUser={openToolUserWithLang}
                isFavorite={favoriteIds.has(translatedTool.tool_id)}
                favoriteLoading={pendingToolId === translatedTool.tool_id}
                onToggleFavorite={handleToggleFavorite}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
