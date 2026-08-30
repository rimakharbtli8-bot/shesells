import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
}

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-ink text-white hover:bg-ink-soft active:scale-[0.98] shadow-soft",
        variant === "secondary" &&
          "bg-sand text-ink hover:bg-sand-dark active:scale-[0.98]",
        variant === "ghost" && "bg-transparent text-ink hover:bg-sand/60",
        variant === "danger" && "bg-danger text-white hover:opacity-90",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base",
        className,
      )}
      {...props}
    />
  );
}
