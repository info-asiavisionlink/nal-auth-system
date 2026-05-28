import type { Language } from "@/lib/i18n/types";
import type { Tool } from "@/types/tool";

export function collectUniqueToolTexts(tools: Tool[]): string[] {
  const unique = new Set<string>();

  for (const tool of tools) {
    if (tool.tool_name.trim()) unique.add(tool.tool_name.trim());
    if (tool.description.trim()) unique.add(tool.description.trim());
    if (tool.category.trim()) unique.add(tool.category.trim());
    if (tool.button_text.trim()) unique.add(tool.button_text.trim());
    for (const tag of tool.tags) {
      if (tag.trim()) unique.add(tag.trim());
    }
  }

  return [...unique];
}

function mapText(
  text: string,
  lookup: Map<string, string>,
): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  return lookup.get(trimmed) ?? text;
}

export function applyToolTextTranslations(tools: Tool[], lookup: Map<string, string>): Tool[] {
  if (lookup.size === 0) return tools;

  return tools.map((tool) => ({
    ...tool,
    tool_name: mapText(tool.tool_name, lookup),
    description: mapText(tool.description, lookup),
    category: mapText(tool.category, lookup),
    button_text: mapText(tool.button_text, lookup),
    tags: tool.tags.map((tag) => mapText(tag, lookup)),
  }));
}

export function buildTranslationLookup(
  sources: string[],
  translations: string[],
): Map<string, string> {
  const lookup = new Map<string, string>();
  for (let index = 0; index < sources.length; index += 1) {
    lookup.set(sources[index], translations[index] ?? sources[index]);
  }
  return lookup;
}

export function getClientTranslationCacheKey(lang: Language, text: string): string {
  return `${lang}:${text}`;
}
