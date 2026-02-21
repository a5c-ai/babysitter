"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ArwesFrameProps {
  children: React.ReactNode;
  lineColor?: string;
  bgColor?: string;
  className?: string;
  animated?: boolean;
}

/**
 * Sci-fi frame component with CSS-based octagonal border and neon glow effects.
 * Provides Arwes-style FrameOctagon look using pure CSS.
 */
export function ArwesFrame({
  children,
  lineColor = "var(--scifi-cyan)",
  bgColor = "rgba(18, 18, 26, 0.85)",
  className,
  animated = true,
}: ArwesFrameProps) {
  return (
    <div
      className={cn("arwes-frame relative", animated && "arwes-frame--animated", className)}
      style={
        {
          "--arwes-frame-line": lineColor,
          "--arwes-frame-bg": bgColor,
        } as React.CSSProperties
      }
    >
      {/* Corner decorations */}
      <div className="arwes-frame__corner arwes-frame__corner--tl" />
      <div className="arwes-frame__corner arwes-frame__corner--tr" />
      <div className="arwes-frame__corner arwes-frame__corner--bl" />
      <div className="arwes-frame__corner arwes-frame__corner--br" />

      {/* Content */}
      <div className="relative z-10">{children}</div>

      <style jsx>{`
        .arwes-frame {
          background: var(--arwes-frame-bg);
          border: 1px solid var(--arwes-frame-line);
          clip-path: polygon(
            12px 0%,
            calc(100% - 12px) 0%,
            100% 12px,
            100% calc(100% - 12px),
            calc(100% - 12px) 100%,
            12px 100%,
            0% calc(100% - 12px),
            0% 12px
          );
          padding: 1px;
        }

        .arwes-frame--animated {
          box-shadow: 0 0 8px color-mix(in srgb, var(--arwes-frame-line) 30%, transparent),
            inset 0 0 8px color-mix(in srgb, var(--arwes-frame-line) 10%, transparent);
          transition: box-shadow 0.3s ease;
        }

        .arwes-frame--animated:hover {
          box-shadow: 0 0 16px color-mix(in srgb, var(--arwes-frame-line) 50%, transparent),
            inset 0 0 12px color-mix(in srgb, var(--arwes-frame-line) 15%, transparent);
        }

        .arwes-frame__corner {
          position: absolute;
          width: 16px;
          height: 16px;
          z-index: 20;
        }

        .arwes-frame__corner--tl {
          top: -1px;
          left: -1px;
          border-top: 2px solid var(--arwes-frame-line);
          border-left: 2px solid var(--arwes-frame-line);
        }

        .arwes-frame__corner--tr {
          top: -1px;
          right: -1px;
          border-top: 2px solid var(--arwes-frame-line);
          border-right: 2px solid var(--arwes-frame-line);
        }

        .arwes-frame__corner--bl {
          bottom: -1px;
          left: -1px;
          border-bottom: 2px solid var(--arwes-frame-line);
          border-left: 2px solid var(--arwes-frame-line);
        }

        .arwes-frame__corner--br {
          bottom: -1px;
          right: -1px;
          border-bottom: 2px solid var(--arwes-frame-line);
          border-right: 2px solid var(--arwes-frame-line);
        }
      `}</style>
    </div>
  );
}

export default ArwesFrame;
