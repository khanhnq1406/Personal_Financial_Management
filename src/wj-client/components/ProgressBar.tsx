import { memo } from "react";

interface ProgressBarProps {
  percentage: number; // 0-100
  label?: string;
  color?: string;
}

export const ProgressBar = memo(function ProgressBar({
  percentage,
  label,
  color = "#008148", // Default to theme green
}: ProgressBarProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div className="w-full">
      {label && (
        <div className="text-xs text-gray-600 mb-1 text-right">{label}</div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${clampedPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
});
