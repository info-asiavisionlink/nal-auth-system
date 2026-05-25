import type { ReactNode } from "react";

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full max-w-[100vw] overflow-x-hidden cyber-grid">
      <div
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 max-w-[100vw] -translate-x-1/2 rounded-full bg-sky-200/40 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 max-w-[100vw] rounded-full bg-amber-200/30 blur-3xl"
        aria-hidden
      />

      <main className="relative z-10 mx-auto flex min-h-screen w-full min-w-0 max-w-md flex-col justify-center px-4 py-10 sm:px-6 sm:py-12">
        <header className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-sky-600">
            NAL Secure Access
          </p>
          <h1 className="neon-text text-3xl font-bold leading-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{subtitle}</p>
        </header>

        <div className="glass-panel w-full min-w-0 max-w-full rounded-2xl p-6 sm:p-8">
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>
        ) : null}
      </main>
    </div>
  );
}
