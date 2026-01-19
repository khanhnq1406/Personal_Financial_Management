import { cn } from "@/lib/utils/cn";

export function BaseCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("bg-white rounded-md drop-shadow-round", className)}>{children}</div>;
}
