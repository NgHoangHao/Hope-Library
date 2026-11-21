import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-variant={variant}
        data-size={size}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-[var(--motion-duration-normal)] ease-[var(--motion-easing-standard)] [@media(hover:hover)]:hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
          // Variants (hover guarded by @media (hover: hover) via Tailwind v4)
          variant === "primary" &&
            "bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-pressed)] text-[var(--color-on-accent)] font-semibold shadow-sm hover:shadow-md",
          variant === "secondary" &&
            "bg-[var(--color-background-surface)] hover:bg-neutral-50 text-[var(--color-text-primary)] border border-[var(--color-border-control)] shadow-xs",
          variant === "outline" &&
            "bg-white/90 hover:bg-white text-[var(--color-text-primary)] border border-[var(--color-border-control)] shadow-xs backdrop-blur-xs",
          variant === "ghost" &&
            "bg-transparent hover:bg-black/5 text-[var(--color-text-primary)]",
          // Sizes
          size === "sm" && "text-xs px-3.5 py-1.5 rounded-full gap-1.5",
          size === "md" && "text-sm px-5 py-2.5 rounded-full gap-2",
          size === "lg" && "text-base px-7 py-3 rounded-full gap-2.5",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
