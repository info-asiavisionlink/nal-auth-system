import type { InputHTMLAttributes } from "react";

type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function InputField({
  label,
  error,
  id,
  className = "",
  ...props
}: InputFieldProps) {
  const inputId = id ?? props.name;

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className="block text-sm font-medium tracking-wide text-cyan-100/90"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`neon-ring w-full rounded-lg border border-cyan-500/25 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-slate-500 transition focus:border-cyan-400/60 ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-rose-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
