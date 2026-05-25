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
      "bg-[#facc15] text-slate-900 shadow-md shadow-amber-200/50 hover:bg-[#fde047]",
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
