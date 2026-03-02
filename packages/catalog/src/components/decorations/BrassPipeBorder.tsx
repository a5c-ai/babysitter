"use client";

interface NeonPipeBorderProps {
  side: "left" | "right";
  className?: string;
}

export function NeonPipeBorder(_props: NeonPipeBorderProps) {
  return null;
}

// Backward compat alias
export const BrassPipeBorder = NeonPipeBorder;

export function PressureGauge(_props: { className?: string; size?: number }) {
  return null;
}

export function ValveWheel(_props: { size?: number; className?: string }) {
  return null;
}
