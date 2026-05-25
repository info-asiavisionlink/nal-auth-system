type PolicyDisclosureProps = {
  buttonLabel: string;
  items: readonly string[];
};

export function PolicyDisclosure({ buttonLabel, items }: PolicyDisclosureProps) {
  return (
    <details className="w-full min-w-0 max-w-full rounded-xl border border-sky-100 bg-white text-sm shadow-sm">
      <summary className="cursor-pointer select-none break-words px-4 py-3 font-semibold text-sky-700 hover:text-sky-800">
        {buttonLabel}
      </summary>
      <ul className="space-y-2 border-t border-sky-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
        {items.map((item) => (
          <li key={item} className="flex min-w-0 gap-2">
            <span className="shrink-0 text-amber-500">•</span>
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
