"use client";

import {
  Treemap,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface TreemapData {
  name: string;
  size: number;
  color?: string;
  children?: TreemapData[];
}

export interface TreemapChartProps {
  title: string;
  description?: string;
  data: TreemapData[];
  className?: string;
  height?: number;
  colors?: string[];
}

const DOMAIN_COLORS: Record<string, string> = {
  science: "#3b82f6",
  engineering: "#10b981",
  business: "#f59e0b",
  arts: "#ec4899",
  technology: "#8b5cf6",
  health: "#ef4444",
  education: "#06b6d4",
  default: "#6b7280",
};

const DEFAULT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      size: number;
      root?: { name: string };
    };
  }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0];
    if (!item) return null;
    const data = item.payload;
    return (
      <div className="rounded-lg border bg-background p-3 shadow-md">
        <p className="font-medium">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Count: <span className="font-semibold text-foreground">{data.size}</span>
        </p>
      </div>
    );
  }
  return null;
}

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  depth: number;
  index: number;
  colors: string[];
  root?: { name: string };
}

function CustomizedContent({
  x,
  y,
  width,
  height,
  name,
  depth,
  index,
  colors,
  root,
}: TreemapContentProps) {
  // Get color based on domain name or fall back to index-based color
  const domainName = root?.name?.toLowerCase() || name?.toLowerCase() || "";
  const baseColor = DOMAIN_COLORS[domainName] || colors[index % colors.length] || DEFAULT_COLORS[0];

  // Adjust color intensity based on depth
  const safeBaseColor = baseColor || DEFAULT_COLORS[0] || "#3b82f6";
  const color = depth === 1 ? safeBaseColor : adjustColorBrightness(safeBaseColor, depth * 10);

  // Only show text if cell is large enough
  const showText = width > 50 && height > 30;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: color,
          stroke: "#fff",
          strokeWidth: 2,
          strokeOpacity: depth === 1 ? 1 : 0.5,
        }}
      />
      {showText && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          dominantBaseline="central"
          className="pointer-events-none select-none"
          style={{
            fill: "#fff",
            fontSize: Math.min(14, Math.max(10, width / 8)),
            fontWeight: depth === 1 ? 600 : 400,
          }}
        >
          {name.length > 15 ? `${name.slice(0, 12)}...` : name}
        </text>
      )}
    </g>
  );
}

function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

export function TreemapChart({
  title,
  description,
  data,
  className,
  height = 300,
  colors = DEFAULT_COLORS,
}: TreemapChartProps) {
  // Transform data to treemap format
  const treemapData = data.map((item, index) => {
    const itemColor = item.color || colors[index % colors.length] || DEFAULT_COLORS[0] || "#3b82f6";
    return {
      name: item.name,
      size: item.size,
      fill: itemColor,
      children: item.children?.map((child) => ({
        name: child.name,
        size: child.size,
        fill: child.color || adjustColorBrightness(itemColor, 20),
      })),
    };
  });

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            fill="#8884d8"
            content={<CustomizedContent x={0} y={0} width={0} height={0} name="" depth={0} index={0} colors={colors} />}
            animationDuration={500}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default TreemapChart;
