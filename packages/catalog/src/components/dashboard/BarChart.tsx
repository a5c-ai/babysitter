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

// Neon sci-fi color palette
const FALLBACK_COLORS = [
  "#FF00E0", // magenta
  "#00DFDF", // cyan
  "#FFD700", // yellow
  "#7B61FF", // violet
  "#FF6B6B", // coral
  "#00FF88", // green
  "#FF3366", // hot pink
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
      <div
        className="rounded-sm p-3"
        style={{
          background: 'var(--scifi-surface)',
          border: '1px solid rgba(0, 223, 223, 0.3)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5), 0 0 8px rgba(0, 223, 223, 0.1)',
        }}
      >
        <p className="font-medium text-white">{data.payload.name}</p>
        <p className="text-sm text-[rgba(255,255,255,0.5)]">
          Count: <span className="font-semibold text-[var(--scifi-cyan)]">{data.value}</span>
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
            <XAxis
              type="number"
              tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
              width={80}
              axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.2)' }}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                formatter={(value) => (
                  <span className="text-sm text-[rgba(255,255,255,0.85)]">{value}</span>
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
