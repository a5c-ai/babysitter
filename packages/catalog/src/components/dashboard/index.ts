/**
 * Dashboard Components
 * Analytics and visualization components for the Process Library Catalog
 */

export { MetricCard, type MetricCardProps, type TrendDirection } from "./MetricCard";
export { BarChart, type BarChartProps, type BarChartData } from "./BarChart";
export { PieChart, type PieChartProps, type PieChartData } from "./PieChart";
export { TreemapChart, type TreemapChartProps, type TreemapData } from "./TreemapChart";
export {
  RecentActivity,
  type RecentActivityProps,
  type ActivityItem,
  type EntityType,
} from "./RecentActivity";
export {
  QuickLinks,
  type QuickLinksProps,
  type QuickLinkItem,
  DEFAULT_QUICK_LINKS,
} from "./QuickLinks";
export { StatsOverview, type StatsOverviewProps } from "./StatsOverview";
