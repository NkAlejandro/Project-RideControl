import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useHoverSound } from "@/lib/use-sounds";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

export function Card({ children, className, padding = "md", hover = false }: CardProps) {
  const { hover: sound } = useHoverSound();
  return (
    <div
      onMouseEnter={hover ? () => sound("card") : undefined}
      className={cn(
        "overflow-hidden rounded-3xl border border-theme-subtle bg-card card-interactive hover-lift animate-fade-in",
        hover && "cursor-pointer hover:shadow-lg hover:shadow-black/20",
        padding === "sm" && "p-3",
        padding === "md" && "p-5",
        padding === "lg" && "p-7",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-3 flex items-center justify-between animate-slide-up", className)}>{children}</div>
  );
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return (
    <h3 className={cn("text-xs font-medium uppercase tracking-wider text-secondary-color animate-slide-up", className)}>
      {children}
    </h3>
  );
}

interface CardValueProps {
  children: ReactNode;
  className?: string;
}

export function CardValue({ children, className }: CardValueProps) {
  return <p className={cn("text-2xl font-semibold tracking-tight text-primary-color animate-slide-up", className)}>{children}</p>;
}
