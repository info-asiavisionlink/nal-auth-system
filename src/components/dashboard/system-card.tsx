"use client";

import { ExternalLink, Star } from "lucide-react";
import { useState } from "react";
import { NeonButton } from "@/components/ui/NeonButton";
import { DEFAULT_THUMBNAIL_PATH } from "@/lib/constants";
import { openManual, openTool } from "@/lib/open-tool";
import type { Tool } from "@/types/tool";

type SystemCardProps = {
  tool: Tool;
  isFavorite: boolean;
  favoriteLoading: boolean;
  onToggleFavorite: (toolId: string) => void;
};

export function SystemCard({
  tool,
  isFavorite,
  favoriteLoading,
  onToggleFavorite,
}: SystemCardProps) {
  const [imageError, setImageError] = useState(false);
  const thumbnailSrc =
    tool.thumbnail_url.trim() || DEFAULT_THUMBNAIL_PATH;
  const showImage = !imageError;
  const hasManual = Boolean(tool.manual_url.trim());
  const primaryLabel = tool.button_text.trim() || "使用する";

  function handleOpenTool() {
    if (!tool.tool_url.trim()) return;
    openTool(tool);
  }

  function handleOpenManual() {
    if (!hasManual) return;
    openManual(tool);
  }

  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-sky-100/80 bg-white/95 p-4 shadow-md shadow-sky-100/40 transition duration-200 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-200/50 sm:p-5">
      <div className="relative mb-4 overflow-hidden rounded-xl border border-sky-50 bg-gradient-to-br from-sky-50 to-white">
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- スプレッドシート由来の任意URL
          <img
            src={thumbnailSrc}
            alt={tool.tool_name}
            className="h-40 w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-40 items-center justify-center bg-gradient-to-br from-sky-50 via-white to-amber-50">
            <span className="text-sm font-semibold text-sky-600">
              {tool.tool_name}
            </span>
          </div>
        )}
        <button
          type="button"
          aria-label={isFavorite ? "お気に入りを解除" : "お気に入りに追加"}
          aria-pressed={isFavorite}
          disabled={favoriteLoading}
          onClick={() => onToggleFavorite(tool.tool_id)}
          className="absolute right-3 top-3 rounded-full border border-sky-100 bg-white/90 p-2 shadow-sm transition hover:bg-sky-50 disabled:opacity-50"
        >
          <Star
            className={`h-5 w-5 ${isFavorite ? "fill-amber-400 text-amber-400" : "text-sky-400"}`}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
            {tool.category}
          </span>
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            {tool.required_credit.toLocaleString()} Credit
          </span>
        </div>

        <h3 className="accent-heading text-lg font-bold leading-snug">
          {tool.tool_name}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">
          {tool.description || "説明はありません。"}
        </p>

        {tool.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {tool.tags.map((tag) => (
              <li
                key={`${tool.tool_id}-${tag}`}
                className="rounded-md border border-sky-100 bg-sky-50/60 px-2 py-0.5 text-xs text-sky-800"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {hasManual ? (
            <button
              type="button"
              onClick={handleOpenManual}
              className="inline-flex min-h-11 items-center justify-center gap-1 rounded-xl border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50"
            >
              使用資料
              <ExternalLink className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          <NeonButton
            type="button"
            className={hasManual ? "w-full" : "w-full sm:col-span-2"}
            disabled={!tool.tool_url.trim()}
            onClick={handleOpenTool}
          >
            {primaryLabel}
          </NeonButton>
        </div>
      </div>
    </article>
  );
}
