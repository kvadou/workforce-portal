"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "success" | "warning" | "glow" | "destructive";
  size?: "sm" | "md" | "lg" | "xl";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles with lift effect
          "inline-flex items-center justify-center font-semibold",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none",
          "rounded-[var(--radius-button)]",
          // Lift effect on hover (except for ghost)
          variant !== "ghost" && "hover:-translate-y-0.5 active:translate-y-0",
          {
            // Primary - Bold purple with glow
            "bg-primary-500 text-white shadow-[var(--shadow-button)] hover:bg-primary-600 hover:shadow-[var(--shadow-button-hover)] focus-visible:ring-primary-500":
              variant === "primary",
            // Secondary - Vibrant orange
            "bg-accent-orange text-white shadow-[var(--shadow-button)] hover:bg-warning-dark hover:shadow-[var(--shadow-button-hover)] focus-visible:ring-accent-orange":
              variant === "secondary",
            // Outline - Purple border
            "border-2 border-primary-500 text-primary-500 bg-transparent hover:bg-primary-50 hover:border-primary-600 focus-visible:ring-primary-500 shadow-none":
              variant === "outline",
            // Ghost - Subtle, no shadow
            "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300 shadow-none":
              variant === "ghost",
            // Success - Green
            "bg-success text-white shadow-[var(--shadow-button)] hover:bg-success-dark hover:shadow-[var(--shadow-button-hover)] focus-visible:ring-success":
              variant === "success",
            // Warning - Orange/amber
            "bg-warning text-white shadow-[var(--shadow-button)] hover:bg-warning-dark hover:shadow-[var(--shadow-button-hover)] focus-visible:ring-warning":
              variant === "warning",
            // Destructive - Red for dangerous actions
            "bg-error text-white shadow-[var(--shadow-button)] hover:bg-error-dark hover:shadow-[var(--shadow-button-hover)] focus-visible:ring-error":
              variant === "destructive",
            // Glow - Primary with enhanced glow effect for CTAs
            "bg-primary-500 text-white shadow-[var(--shadow-primary)] hover:bg-primary-600 hover:shadow-[var(--shadow-primary-lg)] focus-visible:ring-primary-500":
              variant === "glow",
            // Sizes
            "px-3 py-1.5 text-sm min-h-[36px] gap-1.5": size === "sm",
            "px-5 py-2.5 text-base min-h-[44px] gap-2": size === "md",
            "px-6 py-3 text-lg min-h-[52px] gap-2.5": size === "lg",
            "px-8 py-4 text-lg min-h-[60px] gap-3 font-bold": size === "xl",
          },
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

export { Button };
