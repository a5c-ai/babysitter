"use client";

import { useRouter } from "next/navigation";
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
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

export interface BarChartData {
  name: string;
  value: number;
  href?: string;
  color?: string;
}

export interface BarChartProps {
  title: string;
  description?: string;
  data: BarChartData[];
  className?: string;
  height?: number;
  showLegend?: boolean;
  onBarClick?: (data: BarChartData) => void;
  colors?: string[];
}

// Fallback colors if CSS variables are not defined
const FALLBACK_COLORS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: BarChartData;
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0];
    if (!data) return null;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{data.payload.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{data.value}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function BarChart({
  title,
  description,
  data,
  className,
  height = 300,
  showLegend = true,
  onBarClick,
  colors = FALLBACK_COLORS,
}: BarChartProps) {
  const router = useRouter();

  const handleBarClick = (entry: BarChartData) => {
    if (onBarClick) {
      onBarClick(entry);
    } else if (entry.href) {
      router.push(entry.href as never);
    }
  };

  const chartData = data.map((item, index) => ({
    ...item,
    fill: item.color || colors[index % colors.length],
  }));

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <RechartsBarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
          >
            <XAxis type="number" />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12 }}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-muted-foreground">{value}</span>
                )}
              />
            )}
            <Bar
              dataKey="value"
              name="Count"
              radius={[0, 4, 4, 0]}
              cursor={onBarClick || data.some(d => d.href) ? "pointer" : "default"}
              onClick={(entry) => handleBarClick(entry as unknown as BarChartData)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default BarChart;
