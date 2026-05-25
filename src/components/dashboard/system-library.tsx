"use client";

import { useMemo, useState, useTransition } from "react";
import { SystemCard } from "@/components/dashboard/system-card";
import { SystemSearch } from "@/components/dashboard/system-search";
import { createClient } from "@/lib/supabase";
import type { SystemTool } from "@/types/system-tool";

type SystemLibraryProps = {
  tools: SystemTool[];
  initialFavoriteIds: string[];
  userId: string;
  error: string | null;
};

function matchesQuery(tool: SystemTool, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const tagText = tool.tags.join(" ").toLowerCase();

  return (
    tool.tool_name.toLowerCase().includes(normalized) ||
    tool.description.toLowerCase().includes(normalized) ||
    tagText.includes(normalized)
  );
}

function sortTools(tools: SystemTool[], favoriteIds: Set<string>): SystemTool[] {
  return [...tools].sort((a, b) => {
    const aFav = favoriteIds.has(a.tool_id) ? 0 : 1;
    const bFav = favoriteIds.has(b.tool_id) ? 0 : 1;
    if (aFav !== bFav) return aFav - bFav;
    return a.sort_order - b.sort_order;
  });
}

export function SystemLibrary({
  tools,
  initialFavoriteIds,
  userId,
  error,
}: SystemLibraryProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(
    () => new Set(initialFavoriteIds),
  );
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [pendingToolId, setPendingToolId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const categories = useMemo(() => {
    const unique = new Set(tools.map((tool) => tool.category).filter(Boolean));
    return [...unique].sort((a, b) => a.localeCompare(b, "ja"));
  }, [tools]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const categoryMatch = !category || tool.category === category;
      return categoryMatch && matchesQuery(tool, query);
    });
  }, [tools, category, query]);

  const displayTools = useMemo(
    () => sortTools(filteredTools, favoriteIds),
    [filteredTools, favoriteIds],
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
      setFavoriteError(
        "お気に入りの更新に失敗しました。時間をおいて再度お試しください。",
      );
    } finally {
      setPendingToolId(null);
    }
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
      <SystemSearch
        query={query}
        category={category}
        categories={categories}
        onQueryChange={setQuery}
        onCategoryChange={setCategory}
        resultCount={displayTools.length}
        totalCount={tools.length}
      />

      {favoriteError ? (
        <p
          className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {favoriteError}
        </p>
      ) : null}

      {displayTools.length === 0 ? (
        <p className="rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-6 text-center text-sm text-slate-600">
          条件に一致するツールがありません。
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {displayTools.map((tool) => (
            <SystemCard
              key={tool.tool_id}
              tool={tool}
              isFavorite={favoriteIds.has(tool.tool_id)}
              favoriteLoading={pendingToolId === tool.tool_id}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
