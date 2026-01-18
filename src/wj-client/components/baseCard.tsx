export function BaseCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-md drop-shadow-round ${className || ""}`}>{children}</div>
  );
}
