export interface HarnessCliProgram {
  readonly variant: "harness";
  readonly commandName: "babysitter-harness";
  readonly packageName: "@a5c-ai/babysitter-harness";
}

export const HARNESS_PROGRAM: HarnessCliProgram = {
  variant: "harness",
  commandName: "babysitter-harness",
  packageName: "@a5c-ai/babysitter-harness",
};
