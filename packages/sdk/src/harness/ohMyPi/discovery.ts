import { HarnessCapability as Cap, type HarnessSpec } from "../types";

export const OH_MY_PI_DISCOVERY_SPEC: HarnessSpec = {
  name: "oh-my-pi",
  cli: "pi",
  callerEnvVars: ["OMP_SESSION_ID"],
  capabilities: [Cap.SessionBinding, Cap.StopHook, Cap.Programmatic],
  configPaths: [".omp"],
};
