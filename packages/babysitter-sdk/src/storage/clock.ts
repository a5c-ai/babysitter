export type ClockProvider = () => Date;

function systemClock(): Date {
  return new Date();
}

let activeClock: ClockProvider = systemClock;

export function getClockDate(): Date {
  const current = activeClock();
  if (!(current instanceof Date)) {
    throw new Error("Clock provider must return a Date instance");
  }
  return new Date(current.getTime());
}

export function getClockIsoString(): string {
  return getClockDate().toISOString();
}

export function setClockForTests(provider: ClockProvider) {
  if (typeof provider !== "function") {
    throw new Error("setClockForTests requires a function");
  }
  activeClock = provider;
}

export function resetClock() {
  activeClock = systemClock;
}
