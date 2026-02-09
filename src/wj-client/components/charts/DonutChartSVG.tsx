"use client";

import React, { memo } from "react";

/**
 * Data point for donut/pie chart
 */
export interface DonutChartDataPoint {
  /** Value/amount for this segment */
  value: number;
  /** Label for this segment */
  name: string;
  /** Optional color for this segment (overrides default palette) */
  color?: string;
}

/**
 * Donut chart component props
 */
export interface DonutChartSVGProps {
  /** Array of data segments */
  data: DonutChartDataPoint[];
  /** Inner radius as percentage (creates donut hole) - default 60% */
  innerRadiusPercent?: number;
  /** Outer radius as percentage - default 80% */
  outerRadiusPercent?: number;
  /** Height of the chart (default: 300) */
  height?: number;
  /** Custom color palette for segments */
  colors?: string[];
  /** Whether to show legend (default: true) */
  showLegend?: boolean;
  /** Legend position (default: "right") */
  legendPosition?: "left" | "right" | "top" | "bottom";
  /** CSS class name */
  className?: string;
  /** Label to show in center of donut (e.g., total value) */
  centerLabel?: string;
  /** Sub-label to show below center label (e.g., "Total Portfolio") */
  centerSubLabel?: string;
  /** Whether to animate on load (default: true) */
  animate?: boolean;
}

/**
 * Default color palette - using green fintech palette
 */
const DEFAULT_COLORS = [
  "#10b981", // green-500
  "#3b82f6", // blue-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#06b6d4", // cyan-500
  "#f97316", // orange-500
  "#84cc16", // lime-500
];

/**
 * DonutChartSVG component - Pure SVG implementation for React 19 compatibility
 *
 * Displays a donut/pie chart with customizable colors, legend, and center label.
 * Uses native SVG elements instead of Recharts for better React 19 compatibility.
 * Mobile-responsive: legend moves below chart on small screens.
 *
 * @example
 * ```tsx
 * <DonutChartSVG
 *   data={[
 *     { name: "Stocks", value: 50000 },
 *     { name: "Bonds", value: 30000 },
 *     { name: "Crypto", value: 15000 }
 *   ]}
 *   centerLabel="$95,000"
 *   centerSubLabel="Total Portfolio"
 * />
 * ```
 */
export const DonutChartSVG = memo(function DonutChartSVG({
  data,
  innerRadiusPercent = 60,
  outerRadiusPercent = 80,
  height = 300,
  colors = DEFAULT_COLORS,
  showLegend = true,
  legendPosition = "right",
  className = "",
  centerLabel,
  centerSubLabel,
  animate = true,
}: DonutChartSVGProps) {
  // Assign colors to segments
  const coloredData = data.map((point, index) => ({
    ...point,
    color: point.color ?? colors[index % colors.length],
  }));

  // Calculate total value
  const total = coloredData.reduce((sum, item) => sum + item.value, 0);

  // SVG dimensions
  const size = Math.min(height, 400);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) * (outerRadiusPercent / 100);
  const innerRadius = (size / 2) * (innerRadiusPercent / 100);

  // Generate pie slices
  let currentAngle = -90; // Start from top
  const slices = coloredData.map((item, index) => {
    const percentage = total > 0 ? item.value / total : 0;
    const angle = percentage * 360;

    // Calculate path for slice
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;

    // Convert to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate coordinates
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    const x1Inner = centerX + innerRadius * Math.cos(startRad);
    const y1Inner = centerY + innerRadius * Math.sin(startRad);
    const x2Inner = centerX + innerRadius * Math.cos(endRad);
    const y2Inner = centerY + innerRadius * Math.sin(endRad);

    // Create SVG path
    // Special case: if angle is >= 360 (full circle), draw two semicircles
    let path: string;
    if (angle >= 359.99) {
      // Draw full circle as two semicircles
      const midRad = (startRad + Math.PI) % (2 * Math.PI);
      const xMid = centerX + radius * Math.cos(midRad);
      const yMid = centerY + radius * Math.sin(midRad);
      const xMidInner = centerX + innerRadius * Math.cos(midRad);
      const yMidInner = centerY + innerRadius * Math.sin(midRad);

      path = [
        `M ${x1Inner} ${y1Inner}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 1 1 ${xMid} ${yMid}`,
        `A ${radius} ${radius} 0 1 1 ${x1} ${y1}`,
        `L ${x1Inner} ${y1Inner}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${xMidInner} ${yMidInner}`,
        `A ${innerRadius} ${innerRadius} 0 1 0 ${x1Inner} ${y1Inner}`,
        "Z",
      ].join(" ");
    } else {
      const largeArcFlag = angle > 180 ? 1 : 0;
      path = [
        `M ${x1Inner} ${y1Inner}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x2Inner} ${y2Inner}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x1Inner} ${y1Inner}`,
        "Z",
      ].join(" ");
    }

    currentAngle = endAngle;

    return {
      path,
      color: item.color,
      name: item.name,
      value: item.value,
      percentage,
    };
  });

  return (
    <div className={`${className} w-full`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 sm:gap-4 w-full px-2 sm:px-0 pb-2 sm:pb-0">
        {/* Chart Container - with relative positioning for center label */}
        <div className="relative flex-shrink-0 w-full sm:w-auto flex justify-center">
          <div style={{ width: `${size}px`, height: `${size}px`, maxWidth: '100%' }}>
            {/* SVG Chart */}
            <svg
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
              style={{ width: "100%", height: "100%", maxWidth: `${size}px` }}
            >
            {animate ? (
              <>
                <style>{`
                  @keyframes donut-enter {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                  }
                  .donut-slice {
                    animation: donut-enter 0.5s ease-out forwards;
                    transform-origin: center;
                  }
                  .donut-slice:hover {
                    opacity: 0.8;
                    cursor: pointer;
                  }
                `}</style>
                {slices.map((slice, index) => (
                  <g key={index}>
                    <path
                      d={slice.path}
                      fill={slice.color}
                      className="donut-slice"
                      style={{
                        animationDelay: `${index * 50}ms`,
                      }}
                    >
                      <title>{`${slice.name}: ${slice.value.toLocaleString()} (${(slice.percentage * 100).toFixed(1)}%)`}</title>
                    </path>
                  </g>
                ))}
              </>
            ) : (
              slices.map((slice, index) => (
                <g key={index}>
                  <path
                    d={slice.path}
                    fill={slice.color}
                    className="hover:opacity-80 cursor-pointer transition-opacity"
                  >
                    <title>{`${slice.name}: ${slice.value.toLocaleString()} (${(slice.percentage * 100).toFixed(1)}%)`}</title>
                  </path>
                </g>
              ))
            )}
          </svg>

            {/* Center label overlay - positioned absolutely relative to chart container */}
            {(centerLabel || centerSubLabel) && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-2">
                <div className="flex flex-col items-center justify-center text-center">
                  {centerLabel && (
                    <div className="text-base sm:text-lg lg:text-xl font-bold text-neutral-900 leading-tight">
                      {centerLabel}
                    </div>
                  )}
                  {centerSubLabel && (
                    <div className="text-[10px] sm:text-xs text-neutral-600 mt-0.5">
                      {centerSubLabel}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col gap-1.5 text-xs sm:text-sm w-full sm:w-auto sm:min-w-[180px] sm:max-w-[220px]">
            {coloredData.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0.0";
              return (
                <div key={index} className="flex items-center gap-1.5 sm:gap-2 w-full">
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-medium text-neutral-700 truncate min-w-0 flex-1">{item.name}</span>
                  <span className="text-neutral-500 flex-shrink-0 tabular-nums text-right">{percentage}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
