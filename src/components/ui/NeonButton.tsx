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
    "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary:
      "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-[0_0_24px_rgba(0,212,255,0.35)] hover:from-cyan-400 hover:to-blue-500",
    ghost:
      "border border-cyan-500/40 bg-transparent text-cyan-200 hover:border-cyan-400 hover:bg-cyan-500/10",
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
