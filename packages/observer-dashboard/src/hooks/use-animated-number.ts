"use client";
import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook that smoothly animates a number from its previous value to the target.
 * Uses requestAnimationFrame for smooth 60fps transitions.
 *
 * @param target - The number to animate towards
 * @param duration - Animation duration in ms (default 600)
 * @returns The current animated value (integer)
 */
export function useAnimatedNumber(target: number, duration = 600): number {
  const [display, setDisplay] = useState(target);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<{ value: number; time: number } | null>(null);
  const targetRef = useRef(target);
  const displayRef = useRef(target);

  // Easing function: ease-out cubic for a natural deceleration feel
  const easeOutCubic = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  useEffect(() => {
    const prevTarget = targetRef.current;
    targetRef.current = target;

    // No change — skip animation
    if (prevTarget === target) return;

    // Cancel any running animation
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    const startValue = displayRef.current;
    const diff = target - startValue;

    // If diff is 0, just snap
    if (diff === 0) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    // For very small changes (1-2), snap immediately
    if (Math.abs(diff) <= 2) {
      setDisplay(target);
      displayRef.current = target;
      return;
    }

    const startTime = performance.now();
    startRef.current = { value: startValue, time: startTime };

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      const current = Math.round(startValue + diff * easedProgress);
      displayRef.current = current;
      setDisplay(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        animRef.current = null;
        // Ensure we land exactly on target
        displayRef.current = target;
        setDisplay(target);
      }
    }

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [target, duration, easeOutCubic]);

  return display;
}
