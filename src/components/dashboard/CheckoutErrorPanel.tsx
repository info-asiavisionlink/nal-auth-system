import type { CheckoutDisplayError } from "@/lib/checkout-debug";

type CheckoutErrorPanelProps = {
  error: CheckoutDisplayError;
};

export function CheckoutErrorPanel({ error }: CheckoutErrorPanelProps) {
  return (
    <div
      className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
      role="alert"
    >
      <p className="font-semibold text-rose-100">{error.title}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-rose-300/80">
        原因
      </p>
      <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-rose-200">
        {error.cause}
      </p>
      {error.details ? (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-rose-300/80">
            詳細
          </p>
          <p className="mt-1 whitespace-pre-wrap font-mono text-xs text-rose-200/90">
            {error.details}
          </p>
        </>
      ) : null}
    </div>
  );
}
