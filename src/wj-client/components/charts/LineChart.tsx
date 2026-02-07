"use client";

import React, { memo } from "react";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart as RechartsAreaChart,
} from "recharts";
import { formatCurrency } from "@/utils/currency-formatter";
import { chartColors } from "@/app/constants";

/**
 * Data point for line/area chart
 */
export interface LineChartDataPoint {
  /** X-axis value (typically date or time period) */
  [key: string]: string | number | undefined;
  /** Name of the data series (must match key in data) */
  name?: string;
}

/**
 * Configuration for a single data series
 */
export interface LineChartSeries {
  /** Key in data objects for this series */
  dataKey: string;
  /** Display name for legend/tooltip */
  name: string;
  /** Color for this series (line and fill) */
  color?: string;
  /** Whether to show as area chart (filled) */
  showArea?: boolean;
  /** Type of line: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter" */
  curveType?: "monotone" | "linear" | "step" | "stepBefore" | "stepAfter";
  /** Whether to show dots at data points */
  showDots?: boolean;
  /** Stroke width */
  strokeWidth?: number;
}

/**
 * Line chart component props
 */
export interface LineChartProps {
  /** Array of data points */
  data: LineChartDataPoint[];
  /** Series configurations */
  series: LineChartSeries[];
  /** Key in data for X-axis labels */
  xAxisKey: string;
  /** Height of the chart (default: 300) */
  height?: number;
  /** Whether to show grid lines (default: true) */
  showGrid?: boolean;
  /** Whether to show legend (default: true) */
  showLegend?: boolean;
  /** Legend position (default: "top") */
  legendPosition?: "top" | "bottom" | "left" | "right";
  /** Whether to show tooltips (default: true) */
  showTooltip?: boolean;
  /** CSS class name */
  className?: string;
  /** Custom X-axis label formatter */
  xAxisFormatter?: (value: string) => string;
  /** Custom Y-axis label formatter */
  yAxisFormatter?: (value: number) => string;
  /** Custom tooltip formatter */
  tooltipFormatter?: (value: number, name: string, props: any) => [string, string];
  /** Background color for grid (default: transparent) */
  gridColor?: string;
  /** Y-axis domain (min, max values) */
  yAxisDomain?: [number | "auto", number | "auto"];
  /** Whether to animate on load (default: true) */
  animate?: boolean;
}

/**
 * Default colors for series - using green fintech palette
 */
const DEFAULT_SERIES_COLORS = chartColors;

/**
 * LineChart component - Portfolio performance and trends over time
 *
 * Displays line or area charts with support for multiple series.
 * Handles currency formatting, responsive sizing, and animations.
 *
 * @example
 * ```tsx
 * <LineChart
 *   data={[
 *     { month: "Jan", portfolio: 100000, benchmark: 95000 },
 *     { month: "Feb", portfolio: 105000, benchmark: 97000 }
 *   ]}
 *   xAxisKey="month"
 *   series={[
 *     { dataKey: "portfolio", name: "My Portfolio", color: "#10b981", showArea: true },
 *     { dataKey: "benchmark", name: "Benchmark", color: "#94a3b8", showArea: false }
 *   ]}
 * />
 * ```
 */
export const LineChart = memo(function LineChart({
  data,
  series,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  legendPosition = "top",
  showTooltip = true,
  className = "",
  xAxisFormatter,
  yAxisFormatter = (value) => value.toLocaleString(),
  tooltipFormatter,
  gridColor = "#f1f5f9",
  yAxisDomain,
  animate = true,
}: LineChartProps) {
  // Determine if any series uses area fill
  const hasAreaSeries = series.some((s) => s.showArea);

  // Legend layout
  const getLegendLayout = () => {
    switch (legendPosition) {
      case "left":
        return { verticalAlign: "middle", align: "left" };
      case "right":
        return { verticalAlign: "middle", align: "right" };
      case "bottom":
        return { verticalAlign: "bottom", align: "center" };
      default:
        return { verticalAlign: "top", align: "center" };
    }
  };

  const legendLayout = getLegendLayout();

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    return (
      <div className="bg-white/95 backdrop-blur-sm border border-neutral-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-neutral-700 mb-2">
          {xAxisFormatter ? xAxisFormatter(label) : label}
        </p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-neutral-600">{entry.name}:</span>
            <span className="font-semibold text-neutral-900">
              {tooltipFormatter
                ? tooltipFormatter(entry.value, entry.name, entry.payload)[0]
                : yAxisFormatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const ChartComponent = hasAreaSeries ? RechartsAreaChart : RechartsLineChart;

  return (
    <div className={className} style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComponent
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
        >
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
          )}

          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={{ stroke: "#e5e7eb", strokeWidth: 1 }}
            tickFormatter={xAxisFormatter}
          />

          <YAxis
            tick={{ fontSize: 12, fill: "#6b7280" }}
            tickLine={false}
            axisLine={false}
            domain={yAxisDomain}
            tickFormatter={yAxisFormatter}
          />

          {showTooltip && <Tooltip content={<CustomTooltip />} />}

          {showLegend && (
            <Legend
              {...(legendLayout as any)}
              iconType="circle"
              wrapperStyle={{
                fontSize: "12px",
                fontWeight: 500,
              }}
            />
          )}

          {series.map((s, index) => {
            const color = s.color ?? DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length];
            const gradientId = `area-gradient-${s.dataKey}-${index}`;

            return (
              <React.Fragment key={s.dataKey}>
                {s.showArea && (
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                )}
                <Area
                  dataKey={s.dataKey}
                  name={s.name}
                  stroke={color}
                  strokeWidth={s.strokeWidth ?? 2}
                  fill={s.showArea ? `url(#${gradientId})` : "none"}
                  type={s.curveType ?? "monotone"}
                  dot={
                    s.showDots
                      ? { r: 4, fill: color, strokeWidth: 2, stroke: "white" }
                      : false
                  }
                  activeDot={{ r: 5, fill: color, strokeWidth: 2, stroke: "white" }}
                  isAnimationActive={animate}
                  animationBegin={index * 100}
                  animationDuration={750}
                />
              </React.Fragment>
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
});
