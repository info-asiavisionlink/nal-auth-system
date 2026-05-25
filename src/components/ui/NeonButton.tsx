import type { ButtonHTMLAttributes } from "react";

type NeonButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
  loading?: boolean;
};

export function NeonButton({
  children,
  variant = "primary",
  loading = false,
  disabled,
  className = "",
  ...props
}: NeonButtonProps) {
  const base =
    "inline-flex min-h-12 items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-gradient-to-r from-sky-400 via-cyan-400 to-amber-300 text-slate-900 shadow-md shadow-sky-200/60 hover:from-sky-500 hover:via-cyan-500 hover:to-amber-400",
    ghost:
      "border border-sky-200 bg-white text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-50",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
      type={props.type ?? "button"}
      {...props}
    >
      {loading ? "処理中..." : children}
    </button>
  );
}
