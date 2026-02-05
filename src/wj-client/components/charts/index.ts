/**
 * Chart Components - Data visualization using Recharts
 *
 * Export all chart components for easy importing:
 *
 * ```tsx
 * import { Sparkline, DonutChart, LineChart, BarChart } from "@/components/charts";
 * ```
 */

export { Sparkline } from "./Sparkline";
export type {
  SparklineProps,
  SparklineDataPoint,
} from "./Sparkline";

export { DonutChart } from "./DonutChart";
export type {
  DonutChartProps,
  DonutChartDataPoint,
} from "./DonutChart";

export { LineChart } from "./LineChart";
export type {
  LineChartProps,
  LineChartDataPoint,
  LineChartSeries,
} from "./LineChart";

export { BarChart } from "./BarChart";
export type {
  BarChartProps,
  BarChartDataPoint,
  BarChartSeries,
} from "./BarChart";
