import { resetUlidFactory, setUlidFactoryForTests } from "../storage/ulids";
import { resetClock, setClockForTests } from "../storage/clock";

const CROCKFORD_BASE32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const DEFAULT_CLOCK_START_MS = Date.UTC(2025, 0, 1, 0, 0, 0, 0);
const DEFAULT_CLOCK_STEP_MS = 1000;

type ClockValue = string | number | Date;
export type ClockSequenceInput = ClockValue | readonly ClockValue[];

export interface FixedClockOptions {
  start?: ClockValue;
  stepMs?: number;
  sequence?: ClockSequenceInput;
}

export interface FixedClockHandle {
  now(): Date;
  advance(ms?: number): Date;
  reset(): void;
  timestamp(): number;
  apply(): () => void;
  restore(): void;
}

export interface DeterministicUlidOptions {
  preset?: readonly string[];
  epochMs?: number;
  incrementMs?: number;
  randomnessSeed?: number;
}

export interface DeterministicUlidHandle {
  issued: readonly string[];
  next(): string;
  reset(): void;
  apply(): () => void;
  restore(): void;
}

interface ClockController {
  issue(): Date;
  now(): Date;
  advance(ms?: number): Date;
  reset(): void;
  timestamp(): number;
}

interface UlidController {
  next(): string;
  reset(): void;
}

export function installFixedClock(options?: FixedClockOptions): FixedClockHandle {
  const controller = createClockController(options);
  let depth = 0;
  let release: (() => void) | null = null;

  function apply() {
    depth += 1;
    if (depth === 1) {
      release = applyClockController(controller);
    }
    return () => {
      if (depth === 0) {
        return;
      }
      depth -= 1;
      if (depth === 0 && release) {
        release();
        release = null;
      }
    };
  }

  function restore() {
    depth = 0;
    if (release) {
      release();
      release = null;
    } else {
      resetClock();
    }
  }

  return {
    now: () => controller.now(),
    advance: (ms?: number) => controller.advance(ms),
    reset: () => controller.reset(),
    timestamp: () => controller.timestamp(),
    apply,
    restore,
  };
}

export function installDeterministicUlids(options?: DeterministicUlidOptions): DeterministicUlidHandle {
  const issued: string[] = [];
  const controller = createUlidController(options);
  let depth = 0;
  let release: (() => void) | null = null;

  function next(): string {
    const value = controller.next();
    issued.push(value);
    return value;
  }

  function apply() {
    depth += 1;
    if (depth === 1) {
      setUlidFactoryForTests(() => next());
      release = () => {
        resetUlidFactory();
      };
    }
    return () => {
      if (depth === 0) {
        return;
      }
      depth -= 1;
      if (depth === 0 && release) {
        release();
        release = null;
      }
    };
  }

  function restore() {
    depth = 0;
    if (release) {
      release();
      release = null;
    } else {
      resetUlidFactory();
    }
  }

  return {
    issued,
    next,
    reset() {
      issued.length = 0;
      controller.reset();
    },
    apply,
    restore,
  };
}

function createClockController(options?: FixedClockOptions): ClockController {
  if (options?.sequence !== undefined) {
    const sequence = normalizeClockSequence(options.sequence);
    return createSequenceClockController(sequence);
  }
  const start = resolveClockStart(options?.start);
  const stepMs = options?.stepMs ?? DEFAULT_CLOCK_STEP_MS;
  return createTickingClockController(start, stepMs);
}

function createSequenceClockController(sequence: readonly Date[]): ClockController {
  if (sequence.length === 0) {
    throw new Error("Clock sequence must include at least one entry");
  }
  let index = 0;

  function currentIndex() {
    return Math.min(index, sequence.length - 1);
  }

  function clone(date: Date) {
    return new Date(date.getTime());
  }

  return {
    issue() {
      const value = clone(sequence[currentIndex()]);
      if (index < sequence.length - 1) {
        index += 1;
      }
      return value;
    },
    now() {
      return clone(sequence[currentIndex()]);
    },
    advance() {
      if (index < sequence.length - 1) {
        index += 1;
      }
      return clone(sequence[currentIndex()]);
    },
    reset() {
      index = 0;
    },
    timestamp() {
      return sequence[currentIndex()].getTime();
    },
  };
}

function createTickingClockController(startMs: number, stepMs: number): ClockController {
  if (!Number.isFinite(stepMs) || stepMs <= 0) {
    throw new Error("stepMs must be a positive finite number");
  }
  const initial = startMs;
  let current = startMs;

  return {
    issue() {
      const value = new Date(current);
      current += stepMs;
      return value;
    },
    now() {
      return new Date(current);
    },
    advance(ms = stepMs) {
      if (!Number.isFinite(ms)) {
        throw new Error("advance requires a finite number of milliseconds");
      }
      current += ms;
      return new Date(current);
    },
    reset() {
      current = initial;
    },
    timestamp() {
      return current;
    },
  };
}

function applyClockController(controller: ClockController): () => void {
  setClockForTests(() => controller.issue());
  return () => {
    resetClock();
  };
}

function createUlidController(options?: DeterministicUlidOptions): UlidController {
  if (options?.preset && options.preset.length > 0) {
    return createPresetUlidController(options.preset);
  }
  const epochMs = options?.epochMs ?? DEFAULT_CLOCK_START_MS;
  const incrementMs = options?.incrementMs ?? DEFAULT_CLOCK_STEP_MS;
  const randomnessSeed = options?.randomnessSeed ?? 0;
  return createRollingUlidController(epochMs, incrementMs, randomnessSeed);
}

function createPresetUlidController(preset: readonly string[]): UlidController {
  let index = 0;
  return {
    next() {
      const value = preset[index];
      if (value === undefined) {
        throw new Error("Deterministic ULID preset exhausted");
      }
      index += 1;
      return value;
    },
    reset() {
      index = 0;
    },
  };
}

function createRollingUlidController(epochMs: number, incrementMs: number, randomnessSeed: number): UlidController {
  let tick = 0;
  return {
    next() {
      const timestamp = epochMs + tick * incrementMs;
      const timePart = encodeBase32(timestamp, 10);
      const randomPart = encodeBase32(randomnessSeed + tick, 16);
      tick += 1;
      return `${timePart}${randomPart}`;
    },
    reset() {
      tick = 0;
    },
  };
}

function normalizeClockSequence(input: ClockSequenceInput): Date[] {
  if (Array.isArray(input)) {
    if (input.length === 0) {
      throw new Error("Clock sequence must not be empty");
    }
    return input.map(toClockDate);
  }
  return [toClockDate(input as ClockValue)];
}

function toClockDate(value: ClockValue): Date {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Clock numeric value must be finite");
    }
    return new Date(value);
  }
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) {
      throw new Error(`Invalid clock string: ${value}`);
    }
    return new Date(parsed);
  }
  throw new Error("Invalid clock value");
}

function resolveClockStart(start?: ClockValue) {
  if (start === undefined) {
    return DEFAULT_CLOCK_START_MS;
  }
  return toClockDate(start).getTime();
}

function encodeBase32(value: number, length: number) {
  let remaining = Math.max(0, Math.floor(value));
  let out = "";
  while (out.length < length) {
    const idx = remaining % 32;
    out = CROCKFORD_BASE32[idx] + out;
    remaining = Math.floor(remaining / 32);
  }
  return out.slice(-length);
}
