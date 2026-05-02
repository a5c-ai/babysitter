"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_FLASH_DURATION_MS = 1400;

export function useUpdateFlash(signature: string, durationMs = DEFAULT_FLASH_DURATION_MS): boolean {
  const mountedRef = useRef(false);
  const previousSignatureRef = useRef(signature);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameRef = useRef<number | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      previousSignatureRef.current = signature;
      return;
    }
    if (previousSignatureRef.current === signature) {
      return;
    }

    previousSignatureRef.current = signature;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    setActive(false);
    frameRef.current = requestAnimationFrame(() => {
      setActive(true);
      timeoutRef.current = setTimeout(() => {
        setActive(false);
        timeoutRef.current = null;
      }, durationMs);
      frameRef.current = null;
    });
  }, [durationMs, signature]);

  return active;
}
