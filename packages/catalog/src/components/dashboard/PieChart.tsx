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

// Neon sci-fi color palette
const DEFAULT_COLORS = [
  "#FF00E0", // magenta
  "#00DFDF", // cyan
  "#FFD700", // yellow
  "#7B61FF", // violet
  "#FF6B6B", // coral
  "#00FF88", // green
  "#FF3366", // hot pink
  "#33FFFF", // bright cyan
  "#FFA500", // orange
  "#9B59B6", // purple
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
      <div
        className="rounded-sm p-3"
        style={{
          background: 'var(--scifi-surface)',
          border: '1px solid rgba(0, 223, 223, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 223, 223, 0.1)',
        }}
      >
        <p className="font-medium text-white">{data.name}</p>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Count: <span className="font-semibold text-[var(--scifi-cyan)]">{data.value}</span>
        </p>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Percentage: <span className="font-semibold text-[var(--scifi-cyan)]">{percent.toFixed(1)}%</span>
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
            style={{
              backgroundColor: entry.color,
              boxShadow: `0 0 4px ${entry.color}40`,
            }}
          />
          <span className="text-sm text-[rgba(255,255,255,0.85)]">{entry.value}</span>
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
      style={{ textShadow: '0 0 4px rgba(0,0,0,0.5)' }}
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
              fill="#FF00E0"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill || colors[index % colors.length]}
                  stroke="rgba(10,10,15,0.8)"
                  strokeWidth={activeIndex === index ? 3 : 1}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.7}
                  style={{
                    filter: activeIndex === index
                      ? `brightness(1.2) drop-shadow(0 0 6px ${entry.fill}60)`
                      : "none",
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
