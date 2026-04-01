"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, ComponentType, forwardRef, SVGProps } from "react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement> & { title?: string; titleId?: string }>;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconComponent;
  variant?: "ghost" | "subtle" | "outline";
  size?: "sm" | "md" | "lg";
  "aria-label": string;
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, icon: Icon, variant = "ghost", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "inline-flex items-center justify-center flex-shrink-0",
          "transition-all duration-[var(--duration-fast)] ease-[var(--ease-smooth)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "rounded-[var(--radius-default)]",
          // Variants
          {
            "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900":
              variant === "ghost",
            "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900":
              variant === "subtle",
            "border border-neutral-200 text-neutral-600 bg-transparent hover:bg-neutral-50 hover:text-neutral-900":
              variant === "outline",
          },
          // Sizes
          {
            "min-w-[36px] min-h-[36px] w-9 h-9": size === "sm",
            "min-w-[44px] min-h-[44px] w-11 h-11": size === "md",
            "min-w-[52px] min-h-[52px] w-13 h-13": size === "lg",
          },
          className
        )}
        {...props}
      >
        <Icon
          className={cn({
            "w-4 h-4": size === "sm",
            "w-5 h-5": size === "md",
            "w-6 h-6": size === "lg",
          })}
        />
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export { IconButton };
export type { IconButtonProps };
