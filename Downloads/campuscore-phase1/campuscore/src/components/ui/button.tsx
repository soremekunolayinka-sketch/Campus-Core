import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

/**
 * Base button primitive — every module should compose this rather than
 * writing raw <button> styling, so the design system (Blueprint instruction
 * #6) stays consistent as new modules are added.
 */
export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "primary" && "bg-brand text-brand-foreground hover:bg-brand/90",
        variant === "secondary" && "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50",
        variant === "ghost" && "text-slate-700 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
