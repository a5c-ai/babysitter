import type { AgentEndEvent, ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { execSync } from "child_process";
import * as path from "path";
import { initI18n, t } from "./i18n.js";

const PLUGIN_ROOT = path.resolve(__dirname, "..");

const COMMANDS = [
  "assimilate",
  "call",
  "cleanup",
  "contrib",
  "doctor",
  "forever",
  "help",
  "observe",
  "plan",
  "plugins",
  "project-install",
  "resume",
  "retrospect",
  "user-install",
  "yolo",
] as const;

const RESERVED_PI_COMMANDS = new Set<string>(["resume"]);

function toSkillPrompt(name: string, args: string): string {
  return `/skill:${name}${args ? ` ${args}` : ""}`;
}

function syncSessionEnvironment(ctx?: ExtensionContext): string | undefined {
  const sessionId = ctx?.sessionManager.getSessionId();
  if (sessionId) {
    process.env.PI_SESSION_ID = sessionId;
    process.env.BABYSITTER_SESSION_ID = sessionId;
  }

  process.env.PI_PLUGIN_ROOT = PLUGIN_ROOT;
  return sessionId;
}

function sessionStartInput(ctx?: ExtensionContext): Record<string, unknown> {
  const sessionId = syncSessionEnvironment(ctx);
  return {
    event: "session_start",
    cwd: ctx?.cwd ?? process.cwd(),
    ...(sessionId ? { session_id: sessionId } : {}),
  };
}

function finalAssistantText(messages: AgentEndEvent["messages"]): string | undefined {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== "assistant") continue;
    const text = message.content
      .filter((content) => content.type === "text")
      .map((content) => content.text)
      .join("\n");
    return text || undefined;
  }
}

function stopHookInput(
  ctx?: ExtensionContext,
  lastAssistantMessage?: string,
): Record<string, unknown> {
  const sessionId = syncSessionEnvironment(ctx);
  return {
    event: "stop",
    cwd: ctx?.cwd ?? process.cwd(),
    ...(sessionId ? { session_id: sessionId } : {}),
    ...(lastAssistantMessage ? { last_assistant_message: lastAssistantMessage } : {}),
  };
}

/**
 * Run a proxied hook script and return parsed JSON result.
 * Returns empty object on failure (hooks are best-effort).
 */
function runProxiedHook(
  scriptName: string,
  inputData?: Record<string, unknown>
): Record<string, unknown> {
  const scriptPath = path.join(PLUGIN_ROOT, "hooks", scriptName);
  try {
    const result = execSync(`node "${scriptPath}"`, {
      input: inputData ? JSON.stringify(inputData) : undefined,
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 30000,
      env: {
        ...process.env,
        PI_PLUGIN_ROOT: PLUGIN_ROOT,
      },
    });
    return JSON.parse(result.toString("utf8").trim());
  } catch {
    // Hooks are best-effort -- never break the extension
    return {};
  }
}

// Re-entrancy guard so overlapping agent_end events don't stack stop-hook
// subprocess invocations. Run-level iteration bounds are owned by the SDK
// stop hook (max iterations, active-run detection); this only prevents the
// extension from launching concurrent proxied-stop processes.
let stopHookInFlight = false;

export default function activate(pi: ExtensionAPI): void {
  initI18n(pi);

  pi.on("session_start", async (_event, ctx) => {
    runProxiedHook("babysitter-proxied-session-start.js", sessionStartInput(ctx));
  });

  // ---------------------------------------------------------------------------
  // agent_end is the Pi equivalent of Claude Code's Stop hook: it fires when
  // the assistant finishes a turn. Drive the Babysitter stop/iteration loop
  // here so a run auto-continues after each turn.
  //
  // Active-run detection lives in the SDK stop hook (babysitter hook:run
  // --hook-type stop). It no-ops — emitting `{}` — whenever there is no active
  // run for the session (missing/inactive session file, no runId, run waiting
  // on breakpoints/external effects, or completion proof matched). It only
  // emits `{ decision: "block", reason, systemMessage }` when the run should
  // continue, so this handler simply relays that decision. When no run is
  // active, agent_end is a no-op.
  // ---------------------------------------------------------------------------
  pi.on("agent_end", async (event, ctx) => {
    if (stopHookInFlight) return;
    stopHookInFlight = true;
    try {
      const result = runProxiedHook(
        "babysitter-proxied-stop.js",
        stopHookInput(ctx, finalAssistantText(event.messages)),
      );
      // Only re-prompt when the stop hook asks to continue the loop. A `{}`
      // result (no active run / run complete) leaves the turn ended, so the
      // loop terminates naturally — never an unconditional re-trigger.
      if (result && result.decision === "block") {
        const continuation =
          typeof result.reason === "string" && result.reason.trim()
            ? result.reason
            : typeof result.systemMessage === "string"
              ? result.systemMessage
              : "";
        if (continuation.trim()) {
          pi.sendUserMessage(continuation);
        }
      }
    } catch {
      // Best-effort, like session_start — never block or throw out of the turn.
    } finally {
      stopHookInFlight = false;
    }
  });

  // ---------------------------------------------------------------------------
  // Ensure package root is visible even before Pi emits session_start.
  // The concrete session id is refreshed from session_start and command contexts.
  // ---------------------------------------------------------------------------
  syncSessionEnvironment();

  // ---------------------------------------------------------------------------
  // Register slash commands (unchanged from legacy)
  // ---------------------------------------------------------------------------
  const forwardBabysit = async (args: unknown, ctx?: ExtensionContext) => {
    syncSessionEnvironment(ctx);
    pi.sendUserMessage(toSkillPrompt("babysit", String(args ?? "").trim()));
  };

  pi.registerCommand("babysit", {
    description: "Load the Babysitter orchestration skill",
    handler: forwardBabysit,
  });

  pi.registerCommand("babysitter", {
    description: "Alias for /babysit",
    handler: forwardBabysit,
  });

  for (const name of COMMANDS) {
    const forward = async (args: unknown, ctx?: ExtensionContext) => {
      syncSessionEnvironment(ctx);
      pi.sendUserMessage(toSkillPrompt(name, String(args ?? "").trim()));
    };

    if (!RESERVED_PI_COMMANDS.has(name)) {
      pi.registerCommand(name, {
        description: name === "doctor"
          ? t("command.doctor.description", "Open the Babysitter doctor skill")
          : `Open the Babysitter ${name} skill`,
        handler: forward,
      });
    }

    pi.registerCommand(`babysitter:${name}`, {
      description: name === "doctor"
        ? t("command.doctor.aliasDescription", "Alias for /doctor")
        : RESERVED_PI_COMMANDS.has(name)
          ? `Open the Babysitter ${name} skill`
          : `Alias for /${name}`,
      handler: forward,
    });
  }
}
