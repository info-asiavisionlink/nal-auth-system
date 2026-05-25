import type { SignupDisplayError } from "@/lib/signup-debug";

type SignupErrorPanelProps = {
  error: SignupDisplayError;
};

export function SignupErrorPanel({ error }: SignupErrorPanelProps) {
  return (
    <div
      className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
      role="alert"
    >
      <p className="font-semibold text-rose-900">{error.title}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-rose-700">
        原因
      </p>
      <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-rose-800">
        {error.cause}
      </p>
      {error.details ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-rose-700">
            詳細
          </p>
          <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-rose-700">
            {error.details}
          </p>
        </>
      ) : null}
      {error.possibleCauses && error.possibleCauses.length > 0 ? (
        <>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-rose-700">
            考えられる原因
          </p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-xs text-rose-700">
            {error.possibleCauses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}
