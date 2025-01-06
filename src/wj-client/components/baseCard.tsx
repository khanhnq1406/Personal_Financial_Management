export function BaseCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-md drop-shadow-round">{children}</div>
  );
}
