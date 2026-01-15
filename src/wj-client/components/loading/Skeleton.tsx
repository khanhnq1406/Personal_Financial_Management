type SkeletonProps = {
  className?: string;
};

export const Skeleton = ({ className = "" }: SkeletonProps) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="px-2 py-1 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
};

export const WalletListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="px-2 py-1">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="flex justify-between items-center m-3">
          <div className="flex gap-3 items-center">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
};

export const ChartSkeleton = () => {
  return (
    <div className="flex items-end justify-center gap-2 h-32 px-2 py-1">
      <Skeleton className="h-16 w-8" />
      <Skeleton className="h-24 w-8" />
      <Skeleton className="h-20 w-8" />
      <Skeleton className="h-28 w-8" />
      <Skeleton className="h-14 w-8" />
    </div>
  );
};

export const TotalBalanceSkeleton = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
};

export const UserSkeleton = () => {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
};
