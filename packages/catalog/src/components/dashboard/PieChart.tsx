"use client";

import * as React from "react";
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  title: string;
  description?: string;
  data: PieChartData[];
  className?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number;
  showLegend?: boolean;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#84cc16", // lime
  "#f97316", // orange
  "#6366f1", // indigo
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: PieChartData & { percent: number };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    const total = payload.reduce((acc, p) => acc + (p?.value ?? 0), 0);
    const percent = total > 0 ? ((data.value / total) * 100) : 0;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{data.value}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percentage: <span className="font-semibold text-foreground">{percent.toFixed(1)}%</span>
        </p>
      </div>
    );
  }
  return null;
}

interface CustomLegendProps {
  payload?: Array<{
    value: string;
    color: string;
  }>;
}

function CustomLegend({ payload }: CustomLegendProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {payload?.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

const RADIAN = Math.PI / 180;

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

function renderCustomizedLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: LabelProps) {
  if (percent < 0.05) return null; // Don't show labels for slices < 5%

  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function PieChart({
  title,
  description,
  data,
  className,
  height = 300,
  innerRadius = 60,
  outerRadius = 100,
  showLegend = true,
  colors = DEFAULT_COLORS,
}: PieChartProps) {
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsPieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={renderCustomizedLabel}
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={800}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke={entry.fill}
                  strokeWidth={activeIndex === index ? 3 : 1}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                  style={{
                    filter: activeIndex === index ? "brightness(1.1)" : "none",
                    transition: "all 0.2s ease-in-out",
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            {showLegend && <Legend content={<CustomLegend />} />}
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default PieChart;
