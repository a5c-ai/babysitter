import { monotonicFactory } from "ulid";

export type UlidFactory = () => string;

let activeFactory: UlidFactory = monotonicFactory();

export function nextUlid() {
  return activeFactory();
}

/**
 * Overrides the ULID factory so tests can run with deterministic identifiers.
 */
export function setUlidFactoryForTests(factory: UlidFactory) {
  if (typeof factory !== "function") {
    throw new Error("setUlidFactoryForTests requires a function");
  }
  activeFactory = factory;
}

/**
 * Restores the default monotonic ULID factory.
 */
export function resetUlidFactory() {
  activeFactory = monotonicFactory();
}
