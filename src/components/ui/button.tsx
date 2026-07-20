import { type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn-ripple hover-scale press-effect inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.1)]",
        secondary:
          "bg-card text-primary-color hover:bg-hover border border-theme-subtle",
        ghost: "text-secondary-color hover:text-primary-color hover:bg-hover",
        danger:
          "bg-danger-500/10 text-danger-400 hover:bg-danger-500/20 border border-danger-500/20",
        success:
          "bg-success-500/10 text-success-400 hover:bg-success-500/20 border border-success-500/20",
        outline:
          "border border-theme-subtle text-secondary-color hover:bg-hover hover:border-theme-medium",
      },
      size: {
        sm: "min-h-[32px] h-8 px-3 text-xs rounded-xl",
        md: "min-h-[44px] h-11 px-5 text-sm",
        lg: "min-h-[48px] h-12 px-8 text-base",
        icon: "min-h-[44px] min-w-[44px] h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  children,
  variant,
  size,
  loading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
