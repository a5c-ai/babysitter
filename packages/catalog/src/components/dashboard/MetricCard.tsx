"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type TrendDirection = "up" | "down" | "neutral";

export interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: TrendDirection;
    value: string;
  };
  href?: string;
  className?: string;
  animate?: boolean;
}

function AnimatedValue({ value }: { value: number | string }) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const numericValue = typeof value === "number" ? value : parseInt(value, 10);
  const isNumeric = !isNaN(numericValue);

  React.useEffect(() => {
    if (!isNumeric) return;

    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = numericValue / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [numericValue, isNumeric]);

  if (!isNumeric) {
    return <span>{value}</span>;
  }

  return <span>{displayValue.toLocaleString()}</span>;
}

function TrendIndicator({ direction, value }: { direction: TrendDirection; value: string }) {
  const colors = {
    up: "text-green-600 dark:text-green-400",
    down: "text-red-600 dark:text-red-400",
    neutral: "text-gray-500 dark:text-gray-400",
  };

  const icons = {
    up: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
      </svg>
    ),
    down: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
      </svg>
    ),
    neutral: (
      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    ),
  };

  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium", colors[direction])}>
      {icons[direction]}
      {value}
    </span>
  );
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  href,
  className,
  animate = true,
}: MetricCardProps) {
  const content = (
    <Card className={cn(
      "transition-all duration-200",
      href && "cursor-pointer hover:border-primary/50 hover:shadow-md",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">
            {animate ? <AnimatedValue value={value} /> : value}
          </div>
          {trend && (
            <TrendIndicator direction={trend.direction} value={trend.value} />
          )}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href as Route} className="group">
        {content}
      </Link>
    );
  }

  return content;
}

export default MetricCard;
