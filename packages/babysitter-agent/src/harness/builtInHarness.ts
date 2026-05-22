const BUILT_IN_HARNESS_ALIASES = {
  internal: "agent-core",
} as const;

export function normalizeBuiltInHarnessName(harnessName: string): string {
  const normalized = harnessName.trim();
  if (!normalized) {
    return normalized;
  }
  return BUILT_IN_HARNESS_ALIASES[normalized as keyof typeof BUILT_IN_HARNESS_ALIASES] ?? normalized;
}

export function isBuiltInHarnessName(harnessName: string): boolean {
  const normalized = normalizeBuiltInHarnessName(harnessName);
  return normalized === "agent-core" || normalized === "oh-my-pi";
}
