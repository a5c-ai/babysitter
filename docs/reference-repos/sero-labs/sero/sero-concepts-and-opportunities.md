# Sero Architecture Concepts — What We Can Learn & Build

## The Big Ideas

### 1. Agent-as-Workspace (not Agent-in-Sidebar)

Sero's fundamental insight: **put the agent inside the workspace, not the workspace inside the agent.** Traditional agents live in a chat tab. Sero makes the agent the ambient intelligence of the entire development environment — it sees files, branches, running apps, terminal output, and browser content as native context, not injected snippets.

**What this means for us:**
Our genty/desktop-app is currently page-routed (Home → Sessions → Agents → Kanban). Each page is a standalone view. Sero's model is a **split-pane persistent workspace** where chat, terminal, file tree, and browser coexist simultaneously — the agent's context IS the workspace layout.

**What to build:**
- Redesign genty/desktop-app as a **mosaic workspace** (react-mosaic or allotment) with persistent split panes
- Chat pane is always visible alongside the tool output pane
- File explorer pane shows the project the agent is working in
- Terminal pane shows agent's bash commands running in real-time
- When the agent takes a screenshot, it appears inline in the conversation — not as a separate page

### 2. Self-Extending Plugin Paradigm

Sero's most powerful concept: **the agent builds its own plugins on demand.** A user says "I need a tool to analyze my test coverage" → the agent scaffolds a plugin with manifest + tool implementation + optional React UI panel → it's live immediately via Module Federation, no restart.

This is fundamentally different from our plugin system. Our plugins are:
- Created by developers, installed via marketplace
- Static once installed — require CLI commands to modify
- Separate from the agent's reasoning flow

Sero's plugins are:
- Created BY the agent during a conversation
- Live-reloadable (Module Federation)
- Iteratively refined ("extend this tool to also show trends")
- Persistent — once created, available in all future sessions

**What to build:**
- Add a `createPlugin` agentic tool to genty/core that lets the agent scaffold a plugin directory during a conversation
- Add hot-reload to genty/desktop-app and genty/web-app via Vite's HMR or Module Federation
- The agent builds the plugin, loads it, and the user immediately sees a new panel/tool without restarting
- Store agent-created plugins in `.genty/plugins/` per project — they persist across sessions
- The agent can later `extendPlugin` to add capabilities

### 3. Content vs Details: Separating LLM Context from UI Rendering

Pi's tool response pattern elegantly solves a problem we haven't addressed:

```
Tool returns:
  content: "Temperature is 72°F, sunny"      ← goes to LLM context
  details: {temp: 72, forecast: [...]}         ← goes to UI rendering
```

The LLM sees clean text. The UI renders rich structured data. Neither pollutes the other.

**What this means for us:**
Our tool results currently serialize everything as text for the LLM. If a tool returns a table, the LLM gets the table as text AND the UI shows the same text. There's no separation between "what the model needs to reason about" and "what the user needs to see."

**What to build:**
- Extend the tool result type in genty/core to include `content` (for LLM) + `details` (for UI)
- Update EventCards in genty/ui to render `details` as rich UI (charts, tables, images, interactive widgets)
- The LLM gets concise summaries; the user gets full visual richness
- This is particularly powerful for: test results, performance metrics, deployment status, code coverage

### 4. Session as Tree (not Linear Chat)

Pi represents conversation history as a **tree, not a list.** Each message is a node with a parent pointer. Users can fork (`/fork`) to explore alternative approaches without losing the original path. The LLM sees a linearized path from root to current leaf.

**What this means for us:**
Our sessions are linear — a flat list of messages. If the agent goes down a wrong path, you either undo manually or start over. There's no concept of "try this approach" and "try that approach" as branches.

**What to build:**
- Add `parentId` to session messages in sdk/session
- Add `/fork` and `/clone` commands to the conversation
- Visualize the session tree in genty/ui (like a git graph — nodes with branches)
- Enable "switch to branch 2" mid-conversation
- Context compaction can summarize entire dead-end branches

### 5. Hooks as Surgical Extension Points

Pi's hooks system lets extensions intercept the agent loop at precise points:
- `beforeToolCall` / `afterToolCall` — intercept any tool execution
- `message_start` / `message_end` — observe LLM reasoning
- `turn_start` / `turn_end` — lifecycle boundaries

Real uses: plan mode (intercept tool calls, show user, wait for approval), git checkpointing (auto-commit before file mutations), custom compaction triggers.

**What this means for us:**
We already have hooks-adapter with PreToolUse/PostToolUse/Stop/SessionStart/SessionEnd events. But our hooks are primarily for cross-harness normalization — making different CLI agents behave consistently. Sero's hooks are about **composing agent behavior from interceptors.**

**What to build:**
- Expose hooks to agent-created plugins (not just installed harness plugins)
- Let plugins register `beforeToolCall` handlers that can modify, approve, or block tool execution
- This enables: approval gates per-tool, automatic git commits before file edits, logging/auditing, cost budgets, safety filters
- These are different from our babysitter breakpoints — they're lightweight, inline, and composable

### 6. Specialist Agents as Markdown Files

Sero's built-in agents (scout, reviewer, test-writer) are plain markdown files:
```yaml
---
name: scout
tools: [fetch, search]
model: claude-opus
---
# Scout Agent
You are an expert researcher...
```

Editable, forkable, composable. Not code — just configuration + prompt.

**What this means for us:**
We already have this pattern — `.claude/agents/` has markdown agent definitions. But we also have the richer AgentPersona/AgentSoul/AgentDefinition CRD system in Kradle. The opportunity is to **bridge these** — let markdown agent files work as lightweight definitions that can be promoted to full CRD personas when needed.

**What to build:**
- Support `.genty/agents/` directory with markdown agent specs (we partially have this via .claude/agents/)
- Agent specs should compose: "use scout to research, then reviewer to check, then test-writer to verify"
- Enable the agent to CREATE new specialist markdown files during a conversation: "create a database-migration-specialist agent"
- These become reusable across projects

### 7. Context Compaction with Git Checkpointing

Pi's compaction strategy: before summarizing old conversation turns, create a git commit. The agent can later reconstruct state via `git log` and `git diff`. This means compaction doesn't lose information — it just moves it from conversation context to git history.

**What this means for us:**
Our compaction in the SDK compresses conversation history but doesn't coordinate with external state. If the agent was mid-refactor when compaction hits, the conversation summary might lose crucial decisions.

**What to build:**
- Before compaction, auto-commit current changes with a descriptive message
- Include the commit SHA in the compaction summary: "Previous work committed at abc123"
- After compaction, the agent can run `git diff abc123..HEAD` to see what changed
- This is a safety net — compaction becomes reversible

### 8. Visual Reasoning Loop

Sero's browser isn't just for automation — it creates a **closed reasoning loop:**
1. Agent writes code
2. Code renders in browser
3. Agent takes screenshot
4. Agent sees the result visually
5. Agent fixes issues based on what it sees
6. Repeat

With `--annotate`, UI elements get numbered labels that the agent can reference.

**What this means for us:**
Our Puppeteer tool takes screenshots but doesn't feed them back into the agent's reasoning loop naturally. The agent takes a screenshot, gets base64 data, but there's no automatic "look at this and tell me what's wrong" flow.

**What to build:**
- Add a `visualInspect` tool that takes a screenshot + runs the agent's vision capabilities to describe what it sees
- Integrate with the tool result `content/details` pattern: `content` = "The button is misaligned" / `details` = screenshot image
- Add annotated screenshots (numbered element labels) for precise element references
- Enable "watch mode" — agent monitors a running dev server and reacts to visual changes

## Synthesis: The Meta-Pattern

All of Sero's concepts share a meta-pattern: **collapse the distance between the agent and the developer's actual context.**

| Traditional Agent | Sero/Pi Pattern | Our Opportunity |
|---|---|---|
| Chat in a tab | Agent IS the workspace | genty/desktop-app as mosaic workspace |
| Pre-built plugins | Agent builds plugins on demand | createPlugin agentic tool + hot reload |
| Text-only tool results | Content (LLM) + Details (UI) | Extend tool result type |
| Linear chat history | Tree-structured sessions | Fork/clone/branch conversations |
| External hooks config | Composable hook interceptors | Plugin-registered beforeToolCall handlers |
| Code-defined agents | Markdown agent specs | .genty/agents/ with live creation |
| Lossy compaction | Git-checkpointed compaction | Auto-commit before compact |
| Screenshot-then-describe | Visual reasoning loop | visualInspect + annotated screenshots |

The unifying principle: **the agent should be embedded in the developer's reality, not a separate tool they switch to.** Every concept above serves this goal — reducing context switches, maintaining continuity, and enabling the agent to see what the developer sees.
