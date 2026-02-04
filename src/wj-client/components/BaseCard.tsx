import { memo } from "react";
import { cn } from "@/lib/utils/cn";

interface BaseCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "sm" | "md" | "lg" | "none";
  hover?: boolean;
  onClick?: () => void;
}

export const BaseCard = memo(function BaseCard({
  children,
  className,
  padding = "md",
  shadow = "md",
  hover = false,
  onClick,
}: BaseCardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-3 sm:p-4",
    md: "p-4 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-card",
    lg: "shadow-lg",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-lg",
        paddingClasses[padding],
        shadowClasses[shadow],
        hover && "hover:shadow-card-hover cursor-pointer transition-shadow duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
