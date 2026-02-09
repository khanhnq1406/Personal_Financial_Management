"use client";

import React, { memo, useState, useEffect, useRef } from "react";

/**
 * Data point for sparkline chart
 */
export interface SparklineDataPoint {
  /** Value at this point */
  value: number;
  /** Optional label for tooltip */
  label?: string;
}

/**
 * Sparkline component props
 */
export interface SparklineProps {
  /** Array of data points to display */
  data: SparklineDataPoint[];
  /** Color of the line (default: green for positive, red for negative trend) */
  color?: string;
  /** Width of the line (default: 2) */
  strokeWidth?: number;
  /** Whether to show dots at data points (default: false) */
  showDots?: boolean;
  /** Whether to show tooltip on hover (default: false for sparklines) */
  showTooltip?: boolean;
  /** Height of the chart (default: 60) */
  height?: number;
  /** CSS class name */
  className?: string;
  /** Whether to use gradient fill (default: true) */
  showGradient?: boolean;
}

/**
 * Sparkline component - Mini trend indicator for cards
 *
 * Pure SVG implementation without Recharts dependency
 */
export const Sparkline = memo(function Sparkline({
  data,
  color,
  strokeWidth = 2,
  showDots = false,
  showTooltip = false,
  height = 60,
  className = "",
  showGradient = true,
}: SparklineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(300);

  // Measure container width on mount and resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updateWidth = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        if (containerWidth > 0) {
          setWidth(containerWidth);
        }
      }
    };

    // Initial measurement
    setTimeout(updateWidth, 0);

    // Set up ResizeObserver for dynamic resizing
    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Determine trend color if not provided
  const trendColor =
    color ??
    (() => {
      if (data.length < 2) return "#10b981"; // Default green
      const first = data[0].value;
      const last = data[data.length - 1].value;
      return last >= first ? "#10b981" : "#ef4444"; // Green if up, red if down
    })();

  if (!data || data.length === 0) {
    return null;
  }

  // Calculate min and max values for scaling
  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1; // Avoid division by zero

  // Generate SVG path
  const padding = 5;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = data.map((point, index) => {
    const x = padding + (chartWidth * index) / (data.length - 1 || 1);
    const y =
      padding +
      chartHeight -
      ((point.value - minValue) / valueRange) * chartHeight;
    return { x, y, value: point.value };
  });

  // Create SVG path string
  const pathData = points
    .map((point, index) => {
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    })
    .join(" ");

  // Create area fill path (for gradient)
  const areaPath = showGradient
    ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
    : "";

  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          style={{ display: "block" }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity={0.3} />
                <stop offset="100%" stopColor={trendColor} stopOpacity={0} />
              </linearGradient>
            </defs>
          )}

          {/* Area fill */}
          {showGradient && areaPath && (
            <path d={areaPath} fill={`url(#${gradientId})`} />
          )}

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={trendColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Dots */}
          {showDots &&
            points.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={3}
                fill={trendColor}
              />
            ))}
        </svg>
      )}
    </div>
  );
});
