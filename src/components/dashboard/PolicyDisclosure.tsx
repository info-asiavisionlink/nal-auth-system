type PolicyDisclosureProps = {
  buttonLabel: string;
  items: readonly string[];
};

export function PolicyDisclosure({ buttonLabel, items }: PolicyDisclosureProps) {
  return (
    <details className="rounded-lg border border-cyan-500/20 bg-black/25 text-sm">
      <summary className="cursor-pointer select-none px-3 py-2.5 font-medium text-cyan-300 hover:text-cyan-200">
        {buttonLabel}
      </summary>
      <ul className="space-y-2 border-t border-cyan-500/15 px-3 py-3 text-xs leading-relaxed text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="shrink-0 text-cyan-500/80">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
