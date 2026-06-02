/**
 * GAP-REMOTE-001: Timer Scheduler — cron-expression-based trigger scheduling.
 *
 * Supports a subset of cron syntax: minute, hour, day-of-month, month, day-of-week.
 * Uses setInterval to check the cron expression against current time.
 */

import type { TimerAutomationRule } from "@a5c-ai/agent-mux-comm";
import type { TriggerCallback } from "./types";

export interface TimerSchedulerHandle {
  dispose(): void;
}

const CRON_MACROS: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DAY_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

function normalizeCronField(field: string, names?: Record<string, number>): string {
  if (!names) return field;
  return field.replace(/[A-Za-z]{3}/g, (name) => String(names[name.toUpperCase()] ?? name));
}

function parseCronField(field: string, min: number, max: number, names?: Record<string, number>): number[] | null {
  field = normalizeCronField(field, names);
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
      if (start < min || end > max || start > end) return [];
      for (let i = start; i <= end; i += step) {
        values.push(max === 6 && i === 7 ? 0 : i);
      }
    }
    // Range syntax: M-N
    else if (trimmed.includes("-")) {
      const [rMin, rMax] = trimmed.split("-").map((s) => parseInt(s, 10));
      if (isNaN(rMin) || isNaN(rMax) || rMin < min || rMax > max || rMin > rMax) return [];
      for (let i = rMin; i <= rMax; i++) {
        values.push(max === 6 && i === 7 ? 0 : i);
      }
    }
    // Simple number
    else {
      const num = parseInt(trimmed, 10);
      const normalized = max === 6 && num === 7 ? 0 : num;
      if (isNaN(num) || normalized < min || normalized > max) return [];
      values.push(normalized);
    }
  }
  return values.length > 0 ? [...new Set(values)] : [];
}

interface ParsedCron {
  macro?: "reboot";
  minutes: number[] | null;
  hours: number[] | null;
  daysOfMonth: number[] | null;
  months: number[] | null;
  daysOfWeek: number[] | null;
  timezone?: string;
}

function parseCron(expression: string, timezone?: string): ParsedCron | null {
  expression = expression.trim();
  if (expression === "@reboot") {
    return {
      macro: "reboot",
      minutes: [],
      hours: [],
      daysOfMonth: [],
      months: [],
      daysOfWeek: [],
      timezone,
    };
  }
  expression = CRON_MACROS[expression] ?? expression;
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return null;

  return {
    minutes: parseCronField(fields[0], 0, 59),
    hours: parseCronField(fields[1], 0, 23),
    daysOfMonth: parseCronField(fields[2], 1, 31),
    months: parseCronField(fields[3], 1, 12, MONTH_NAMES),
    daysOfWeek: parseCronField(fields[4], 0, 7, DAY_NAMES)?.map((day) => day === 7 ? 0 : day) ?? null,
    timezone,
  };
}

function getCronDateParts(date: Date, timezone?: string): {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
} {
  if (!timezone) {
    return {
      minute: date.getMinutes(),
      hour: date.getHours(),
      dayOfMonth: date.getDate(),
      month: date.getMonth() + 1,
      dayOfWeek: date.getDay(),
    };
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const year = Number(values.year);
  const month = Number(values.month);
  const dayOfMonth = Number(values.day);
  return {
    minute: Number(values.minute),
    hour: Number(values.hour),
    dayOfMonth,
    month,
    dayOfWeek: new Date(Date.UTC(year, month - 1, dayOfMonth)).getUTCDay(),
  };
}

function matchesCron(parsed: ParsedCron, date: Date): boolean {
  const { minute, hour, dayOfMonth, month, dayOfWeek } = getCronDateParts(date, parsed.timezone);

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
    .map((t) => ({ trigger: t, parsed: parseCron(t.trigger.cron, t.trigger.timezone) }))
    .filter((t) => t.parsed !== null) as Array<{ trigger: TimerAutomationRule; parsed: ParsedCron }>;

  for (const { trigger, parsed } of parsedTriggers) {
    if (parsed.macro === "reboot") {
      queueMicrotask(() => {
        void onTrigger({
          type: "automation",
          rule: trigger,
          inputs: { scheduledBy: "@reboot" },
        });
      });
    }
  }

  let lastMinute = -1;
  const interval = setInterval(() => {
    const now = new Date();
    const currentMinute = now.getMinutes() + now.getHours() * 60;

    // Only check once per minute
    if (currentMinute === lastMinute) return;
    lastMinute = currentMinute;

    for (const { trigger, parsed } of parsedTriggers) {
      if (parsed.macro === "reboot") continue;
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
