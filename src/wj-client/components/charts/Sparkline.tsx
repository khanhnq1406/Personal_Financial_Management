"use client";

import React, { memo } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  YAxis,
  XAxis,
} from "recharts";

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
 * Displays a small line chart showing trends over time.
 * Automatically determines color based on trend (first to last value).
 *
 * @example
 * ```tsx
 * <Sparkline data={[{value: 100}, {value: 120}, {value: 115}, {value: 130}]} />
 * ```
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
  // Determine trend color if not provided
  const trendColor = color ?? (() => {
    if (data.length < 2) return "#10b981"; // Default green
    const first = data[0].value;
    const last = data[data.length - 1].value;
    return last >= first ? "#10b981" : "#ef4444"; // Green if up, red if down
  })();

  // Gradient ID for this instance
  const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
        >
          {showGradient && (
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={trendColor}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={trendColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
          )}

          <XAxis
            dataKey="label"
            hide={!showTooltip}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            hide={!showTooltip}
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={["auto", "auto"]}
          />

          {showTooltip && (
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                fontSize: "12px",
                padding: "6px 10px",
              }}
              formatter={(value: number) => [value.toLocaleString(), "Value"]}
            />
          )}

          <Line
            type="monotone"
            dataKey="value"
            stroke={trendColor}
            strokeWidth={strokeWidth}
            dot={showDots ? { r: 3, fill: trendColor } : false}
            activeDot={showDots || showTooltip ? { r: 4, fill: trendColor } : false}
            fill={showGradient ? `url(#${gradientId})` : undefined}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
});
