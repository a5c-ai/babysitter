export type BabysitterAgentSeamVisibility = "public" | "internal";

export interface BabysitterAgentSeamContract {
  id: string;
  owner: string;
  visibility: BabysitterAgentSeamVisibility;
  responsibilities: string[];
  directories: string[];
  packageExports: string[];
  validationCommands: string[];
}

export const BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS = [
  "npm run build --workspace=@a5c-ai/tula-platform",
  "npm run test --workspace=@a5c-ai/tula-platform",
] as const;

export const babysitterAgentSeamContracts = [
  {
    id: "runtime-foundation",
    owner: "runtime-core",
    visibility: "public",
    responsibilities: [
      "Own orchestration/runtime helpers that remain aligned with the SDK replay model.",
      "Own persisted run state, session continuity, task artifacts, and prompt/compression helpers used by runtime flows.",
      "Provide the default leaf seam to validate before proposing any extraction of runtime internals.",
    ],
    directories: [
      "runtime",
      "session",
      "storage",
      "tasks",
      "compression",
    ],
    packageExports: [
      "./runtime",
      "./session",
      "./storage",
      "./tasks",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
  {
    id: "governance-control",
    owner: "governance-control",
    visibility: "public",
    responsibilities: [
      "Own policy, authority, posture, and breakpoint decision logic.",
      "Keep human-approval flows and governance enforcement aligned before any package split is attempted.",
    ],
    directories: [
      "governance",
      "breakpoints",
    ],
    packageExports: [
      "./governance",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
  {
    id: "integration-bridges",
    owner: "harness-integration",
    visibility: "public",
    responsibilities: [
      "Own harness invocation, agent-core integration, MCP transport/client glue, and API-facing orchestration adapters.",
      "Keep external integration surfaces grouped under one review boundary until a narrower runtime seam proves real.",
    ],
    directories: [
      "harness",
      "mcp",
      "api",
      "anycli",
    ],
    packageExports: [
      "./harness",
      "./api",
      "./mcp/transport",
      "./anycli",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
  {
    id: "operator-surfaces",
    owner: "runtime-operations",
    visibility: "public",
    responsibilities: [
      "Own operator-facing platform helpers such as daemon lifecycle, interaction UX, cost reporting, and observability helpers.",
      "Contain operational support changes so user-facing workflows can be validated without reopening every runtime concern.",
    ],
    directories: [
      "daemon",
      "interaction",
      "observability",
      "cost",
    ],
    packageExports: [
      "./daemon",
      "./interaction",
      "./observability",
      "./cost",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
  {
    id: "platform-capabilities",
    owner: "platform-core",
    visibility: "public",
    responsibilities: [
      "Own L6 platform capabilities: skill routing, process recommendation, and plugin sandboxing.",
      "Keep capability implementations grouped under one review boundary.",
    ],
    directories: [
      "skills",
      "processes",
      "plugins",
    ],
    packageExports: [
      "./skills",
      "./processes",
      "./plugins",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
  {
    id: "seam-contract",
    owner: "v6-architecture",
    visibility: "public",
    responsibilities: [
      "Own the executable manifest that assigns every top-level src domain to a slice.",
      "Prevent new package-level domains from appearing without an explicit owner, visibility, and validation gate.",
    ],
    directories: [
      "seams",
    ],
    packageExports: [
      "./seams",
    ],
    validationCommands: [...BABYSITTER_AGENT_SEAM_VALIDATION_COMMANDS],
  },
] as const satisfies readonly BabysitterAgentSeamContract[];

export function listBabysitterAgentSeamDirectories(): string[] {
  return babysitterAgentSeamContracts.flatMap((contract) => contract.directories);
}

export function listBabysitterAgentPublicExports(): string[] {
  return babysitterAgentSeamContracts.flatMap((contract) => contract.packageExports);
}
