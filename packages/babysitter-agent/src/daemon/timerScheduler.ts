/**
 * GAP-REMOTE-001: Timer Scheduler — cron-expression-based trigger scheduling.
 *
 * Supports a subset of cron syntax: minute, hour, day-of-month, month, day-of-week.
 * Uses setInterval to check the cron expression against current time.
 */

import type { TimerAutomationRule } from "@a5c-ai/agent-mux-core";
import type { TriggerCallback } from "./types";

export interface TimerSchedulerHandle {
  dispose(): void;
}

/**
 * Parse a simple 5-field cron expression into match arrays.
 * Fields: minute hour day-of-month month day-of-week
 * Supports: *, specific numbers, comma-separated values.
 */
function parseCronField(field: string, min: number, max: number): number[] | null {
  if (field === "*") return null; // matches all
  const values: number[] = [];
  for (const part of field.split(",")) {
    const trimmed = part.trim();
    // Step syntax: */N or M-N/S
    if (trimmed.includes("/")) {
      const [rangeStr, stepStr] = trimmed.split("/");
      const step = parseInt(stepStr, 10);
      if (isNaN(step) || step <= 0) return [];
      let start = min;
      let end = max;
      if (rangeStr !== "*") {
        if (rangeStr.includes("-")) {
          const [rMin, rMax] = rangeStr.split("-").map((s) => parseInt(s, 10));
          if (isNaN(rMin) || isNaN(rMax)) return [];
          start = rMin;
          end = rMax;
        } else {
          start = parseInt(rangeStr, 10);
          if (isNaN(start)) return [];
        }
      }
      for (let i = start; i <= end; i += step) {
        values.push(i);
      }
    }
    // Range syntax: M-N
    else if (trimmed.includes("-")) {
      const [rMin, rMax] = trimmed.split("-").map((s) => parseInt(s, 10));
      if (isNaN(rMin) || isNaN(rMax) || rMin < min || rMax > max) return [];
      for (let i = rMin; i <= rMax; i++) {
        values.push(i);
      }
    }
    // Simple number
    else {
      const num = parseInt(trimmed, 10);
      if (isNaN(num) || num < min || num > max) return [];
      values.push(num);
    }
  }
  return values.length > 0 ? values : [];
}

interface ParsedCron {
  minutes: number[] | null;
  hours: number[] | null;
  daysOfMonth: number[] | null;
  months: number[] | null;
  daysOfWeek: number[] | null;
}

function parseCron(expression: string): ParsedCron | null {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  return {
    minutes: parseCronField(fields[0], 0, 59),
    hours: parseCronField(fields[1], 0, 23),
    daysOfMonth: parseCronField(fields[2], 1, 31),
    months: parseCronField(fields[3], 1, 12),
    daysOfWeek: parseCronField(fields[4], 0, 6),
  };
}

function matchesCron(parsed: ParsedCron, date: Date): boolean {
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1;
  const dayOfWeek = date.getDay();

  if (parsed.minutes && !parsed.minutes.includes(minute)) return false;
  if (parsed.hours && !parsed.hours.includes(hour)) return false;
  if (parsed.daysOfMonth && !parsed.daysOfMonth.includes(dayOfMonth)) return false;
  if (parsed.months && !parsed.months.includes(month)) return false;
  if (parsed.daysOfWeek && !parsed.daysOfWeek.includes(dayOfWeek)) return false;

  return true;
}

export function createTimerScheduler(
  triggers: TimerAutomationRule[],
  onTrigger: TriggerCallback,
): TimerSchedulerHandle {
  const parsedTriggers = triggers
    .map((t) => ({ trigger: t, parsed: parseCron(t.trigger.cron) }))
    .filter((t) => t.parsed !== null) as Array<{ trigger: TimerAutomationRule; parsed: ParsedCron }>;

  let lastMinute = -1;
  const interval = setInterval(() => {
    const now = new Date();
    const currentMinute = now.getMinutes() + now.getHours() * 60;

    // Only check once per minute
    if (currentMinute === lastMinute) return;
    lastMinute = currentMinute;

    for (const { trigger, parsed } of parsedTriggers) {
      if (matchesCron(parsed, now)) {
        void onTrigger({
          type: "automation",
          rule: trigger,
        });
      }
    }
  }, 30_000); // Check every 30 seconds

  return {
    dispose() {
      clearInterval(interval);
    },
  };
}
