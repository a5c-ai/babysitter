"use client";

import { cn } from "@/lib/utils";

export interface ArwesBackgroundProps {
  className?: string;
  showGrid?: boolean;
  showDots?: boolean;
  /** Grid line opacity (0-1) */
  gridOpacity?: number;
  /** Dot opacity (0-1) */
  dotOpacity?: number;
}

/**
 * Subtle sci-fi background with grid lines and dot patterns.
 * CSS-based alternative to Arwes GridLines/Dots components.
 */
export function ArwesBackground({
  className,
  showGrid = true,
  showDots = true,
  gridOpacity = 0.04,
  dotOpacity = 0.15,
}: ArwesBackgroundProps) {
  return (
    <div
      className={cn("arwes-background pointer-events-none fixed inset-0 z-0", className)}
      aria-hidden="true"
    >
      {showGrid && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(0, 223, 223, ${gridOpacity}) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 223, 223, ${gridOpacity}) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      )}
      {showDots && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(0, 223, 223, ${dotOpacity}) 1px, transparent 1px)`,
            backgroundSize: "30px 30px",
          }}
        />
      )}
      {/* Subtle moving gradient effect */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 20% 50%, rgba(255, 0, 224, 0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 50%, rgba(0, 223, 223, 0.04) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

export default ArwesBackground;
