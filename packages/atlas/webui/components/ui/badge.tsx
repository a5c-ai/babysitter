"use client";

import * as React from "react";
import { Tag } from "@a5c-ai/compendium";
import { clsx } from "clsx";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "destructive";
}

export function Badge({ className, variant, children, ...props }: BadgeProps) {
  const tagChildren = typeof children === "bigint"
    ? children.toString()
    : (children as Exclude<React.ReactNode, bigint>);

  return (
    <span className={clsx("inline-flex", className)} {...props}>
      <Tag>{tagChildren as never}</Tag>
    </span>
  );
}
