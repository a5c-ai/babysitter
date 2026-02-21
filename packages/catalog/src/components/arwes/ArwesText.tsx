"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ArwesTextProps {
  children: string;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
  manager?: "sequence" | "decipher";
  className?: string;
  duration?: number;
  /** Set to true to enable the typing/decipher animation. Defaults to false (static text). */
  animate?: boolean;
}

/**
 * Animated text component with CSS-based typing/decipher effects.
 * Provides Arwes-style text animation using pure CSS and JS.
 * Animation is opt-in via the `animate` prop to avoid visual artifacts on card titles.
 */
export function ArwesText({
  children,
  as: Tag = "span",
  manager = "sequence",
  className,
  duration = 1000,
  animate = false,
}: ArwesTextProps) {
  const [displayText, setDisplayText] = React.useState(animate ? "" : children);
  const [isComplete, setIsComplete] = React.useState(!animate);

  React.useEffect(() => {
    if (!animate) {
      setDisplayText(children);
      setIsComplete(true);
      return;
    }

    const text = children;
    const totalChars = text.length;
    const charDelay = duration / totalChars;

    if (manager === "sequence") {
      let currentIndex = 0;
      const timer = setInterval(() => {
        currentIndex++;
        if (currentIndex >= totalChars) {
          setDisplayText(text);
          setIsComplete(true);
          clearInterval(timer);
        } else {
          setDisplayText(text.slice(0, currentIndex));
        }
      }, charDelay);
      return () => clearInterval(timer);
    } else {
      // Decipher effect: show random chars then reveal
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
      const revealed = new Array(totalChars).fill(false);
      let revealedCount = 0;

      const timer = setInterval(() => {
        // Reveal one more character each tick
        if (revealedCount < totalChars) {
          // Find an unrevealed index
          let idx = Math.floor(Math.random() * totalChars);
          let attempts = 0;
          while (revealed[idx] && attempts < totalChars) {
            idx = (idx + 1) % totalChars;
            attempts++;
          }
          revealed[idx] = true;
          revealedCount++;
        }

        // Build display string
        const result = text
          .split("")
          .map((char, i) => {
            if (revealed[i]) return char;
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("");

        setDisplayText(result);

        if (revealedCount >= totalChars) {
          setDisplayText(text);
          setIsComplete(true);
          clearInterval(timer);
        }
      }, charDelay);

      return () => clearInterval(timer);
    }
  }, [children, manager, duration, animate]);

  // When not animating, render a simple clean element with no animation artifacts
  if (!animate) {
    return (
      <Tag className={cn("arwes-text", className)}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag
      className={cn(
        "arwes-text",
        !isComplete && "arwes-text--animating",
        className
      )}
    >
      {displayText}
      {!isComplete && <span className="arwes-text__cursor">|</span>}
      <style jsx>{`
        .arwes-text {
          display: inline;
        }

        .arwes-text--animating {
          color: var(--scifi-cyan);
        }

        .arwes-text__cursor {
          display: inline;
          animation: blink-cursor 0.6s step-end infinite;
          color: var(--scifi-cyan);
          font-weight: 100;
        }

        @keyframes blink-cursor {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </Tag>
  );
}

export default ArwesText;
