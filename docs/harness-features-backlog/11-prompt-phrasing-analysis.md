# Prompt Phrasing Analysis: CC System Prompts Deep-Dive

**Category**: Prompt Engineering Intelligence
**Source**: CC source code -- exact phrasing extracted from Claude Code internals

This document catalogs specific prompt text, tool descriptions, safety rules, persona instructions, and context assembly patterns from Claude Code that the Babysitter harness should adopt or adapt. Each section includes the exact CC phrasing and a gap assessment against our current prompt generation (`packages/sdk/src/prompts/`).

---

## 1. System Prompt Architecture

### CC Prompt Assembly Order

CC builds its system prompt in a strict priority hierarchy (`src/utils/systemPrompt.ts`):

1. **Override** (replaces everything if set)
2. **Coordinator** (replaces default entirely in coordinator mode)
3. **Agent** (replaces default in normal mode; appends in proactive mode)
4. **Custom** (user-supplied `appendSystemPrompt`)
5. **Default** (the standard prompt from `src/constants/prompts.ts`)

**Gap**: Our `PromptContext` + per-harness context factories compose prompts but have no equivalent priority hierarchy. All sections are concatenated without precedence rules.

**Actionable**: Implement a prompt priority model in `packages/sdk/src/prompts/` where overlay prompts (process-specific, phase-specific, mode-specific) have clear precedence over defaults.

### CC Prompt Sections (in order)

The default system prompt is assembled from these sections:

1. **Identity**: `"You are Claude Code, Anthropic's official CLI for Claude."`
2. **Simple Intro**: `"You are an interactive agent that helps users with software engineering tasks."`
3. **System section**: Tool output visibility, permission modes, auto-compression, system-reminder tags, prompt injection detection
4. **Doing Tasks**: Coding philosophy (don't over-engineer, don't add features beyond what was asked)
5. **Cyber Risk**: Security testing boundaries
6. **Executing Actions with Care**: Reversibility and blast radius assessment
7. **Using Your Tools**: Tool preference rules (dedicated tools over Bash)
8. **Tone and Style**: Emoji policy, conciseness, code references
9. **Output Efficiency**: Brevity rules
10. **Environment**: Platform, shell, git status, model info

**Gap**: Our `instructions:babysit-skill` generates orchestration-focused prompts but does not include equivalent coding philosophy, tool preference rules, or output efficiency instructions. The delegated harness (CC) brings its own, but when using Pi or other harnesses, these are missing.

---

## 2. Coding Philosophy Instructions (High Priority)

### "Doing Tasks" Section -- Exact Phrasing

These instructions from `src/constants/prompts.ts` are highly effective at preventing common AI coding mistakes:

> "Don't add features, refactor code, or make 'improvements' beyond what was asked. A bug fix doesn't need surrounding code cleaned up. A simple feature doesn't need extra configurability. Don't add docstrings, comments, or type annotations to code you didn't change. Only add comments where the logic isn't self-evident."

> "Don't add error handling, fallbacks, or validation for scenarios that can't happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use feature flags or backwards-compatibility shims when you can just change the code."

> "Don't create helpers, utilities, or abstractions for one-time operations. Don't design for hypothetical future requirements. The right amount of complexity is what the task actually requires -- no speculative abstractions, but no half-finished implementations either. Three similar lines of code is better than a premature abstraction."

> "Avoid backwards-compatibility hacks like renaming unused _vars, re-exporting types, adding // removed comments for removed code, etc. If you are certain that something is unused, you can delete it completely."

> "If an approach fails, diagnose why before switching tactics -- read the error, check your assumptions, try a focused fix. Don't retry the identical action blindly, but don't abandon a viable approach after a single failure either."

**Gap**: Our process prompts and `instructions:*` output do not include any equivalent coding philosophy. When orchestrating tasks via non-CC harnesses (Pi, Gemini, Codex), the delegated agent lacks these guardrails.

**Recommendation**: Add a `codingPhilosophy` prompt section to `packages/sdk/src/prompts/` that is injected into task prompts for code-writing tasks.

---

## 3. Tool Preference Rules (High Priority)

### "Using Your Tools" Section -- Exact Phrasing

CC has explicit rules preventing Bash misuse:

> "Do NOT use the Bash to run commands when a relevant dedicated tool is provided. Using dedicated tools allows the user to better understand and review your work. This is CRITICAL to assisting the user:
> - To read files use Read instead of cat, head, tail, or sed
> - To edit files use Edit instead of sed or awk
> - To create files use Write instead of cat with heredoc or echo redirection
> - To search for files use Glob instead of find or ls
> - To search the content of files, use Grep instead of grep or rg
> - Reserve using the Bash exclusively for system commands and terminal operations that require shell execution."

**Gap**: Our agentic tool definitions (`packages/sdk/src/harness/agenticTools.ts`) define tools but do not include meta-instructions about when to prefer which tool. When Pi sessions use our agentic tools, the agent lacks guidance on tool selection.

**Recommendation**: Add tool preference instructions to the agentic tools system prompt preamble.

---

## 4. Safety & Security Instructions (High Priority)

### Cyber Risk Instruction -- Exact Phrasing

From `src/constants/cyberRiskInstruction.ts`:

> "IMPORTANT: Assist with authorized security testing, defensive security, CTF challenges, and educational contexts. Refuse requests for destructive techniques, DoS attacks, mass targeting, supply chain compromise, or detection evasion for malicious purposes. Dual-use security tools (C2 frameworks, credential testing, exploit development) require clear authorization context: pentesting engagements, CTF competitions, security research, or defensive use cases."

### Careful Reversibility -- Exact Phrasing

From `src/constants/prompts.ts` (Actions section):

> "Carefully consider the reversibility and blast radius of actions. Generally you can freely take local, reversible actions like editing files or running tests. But for actions that are hard to reverse, affect shared systems beyond your local environment, or could otherwise be risky or destructive, check with the user before proceeding."

Specific examples listed:
- **Destructive operations**: deleting files/branches, dropping database tables, killing processes, rm -rf
- **Hard-to-reverse operations**: force-pushing, git reset --hard, amending published commits
- **Actions visible to others**: pushing code, creating/closing PRs/issues, sending messages
- **Third-party uploads**: consider sensitivity before sending to external tools

**Gap**: Our breakpoint system (`packages/sdk/src/breakpoints/`) gates on user approval but process prompts do not include equivalent reversibility reasoning. The delegated agent is not instructed to think about blast radius before acting.

**Recommendation**: Add a `safetyGuidelines` prompt section for task prompts that includes both the cyber risk boundary and the reversibility framework.

---

## 5. Output Efficiency Rules (Medium Priority)

### Exact Phrasing

> "IMPORTANT: Go straight to the point. Try the simplest approach first without going in circles. Do not overdo it. Be extra concise."

> "Keep your text output brief and direct. Lead with the answer or action, not the reasoning. Skip filler words, preamble, and unnecessary transitions. Do not restate what the user said -- just do it."

> "Focus text output on:
> - Decisions that need the user's input
> - High-level status updates at natural milestones
> - Errors or blockers that change the plan"

> "If you can say it in one sentence, don't use three."

**Gap**: Our iteration prompts do not include output efficiency guidelines. Delegated agents often produce verbose output that consumes token budget unnecessarily.

**Recommendation**: Include output efficiency rules in the `session:iteration-message` prompt template.

---

## 6. Git Operations Protocol (Medium Priority)

### Commit Protocol -- Exact Phrasing

CC has a detailed, step-by-step commit protocol:

> "1. Run git status, git diff, git log in parallel
> 2. Analyze all staged changes and draft a commit message: Summarize the nature of the changes. Do not commit files that likely contain secrets (.env, credentials.json, etc).
> 3. Add relevant untracked files, create the commit, run git status after.
> 4. If the commit fails due to pre-commit hook: fix the issue and create a NEW commit."

Critical rules:
> "NEVER update the git config"
> "NEVER run destructive git commands (push --force, reset --hard) unless the user explicitly requests"
> "NEVER skip hooks (--no-verify, --no-gpg-sign) unless the user explicitly requests"
> "CRITICAL: Always create NEW commits rather than amending, unless the user explicitly requests"

**Gap**: Our process prompts do not include git safety protocols. When orchestrated tasks involve git operations, the delegated agent lacks these guardrails.

**Recommendation**: Add a `gitSafety` prompt section injected when tasks involve code changes or version control.

---

## 7. Tool Descriptions -- Key Patterns (Medium Priority)

### Pattern: Read-Before-Edit Enforcement

Multiple CC tools enforce a read-before-write pattern:

**FileEditTool**: `"You must use your Read tool at least once in the conversation before editing. This tool will error if you attempt an edit without reading the file."`

**FileWriteTool**: `"If this is an existing file, you MUST use the Read tool first to read the file's contents. This tool will fail if you did not read the file first."`

**Gap**: Our agentic tools do not enforce read-before-write. Agents can blindly overwrite files.

### Pattern: Dedicated Tool Preference

**GrepTool**: `"ALWAYS use Grep for search tasks. NEVER invoke grep or rg as a Bash command. The Grep tool has been optimized for correct permissions and access."`

**GlobTool**: `"When you are doing an open ended search that may require multiple rounds of globbing and grepping, use the Agent tool instead"`

### Pattern: Agent Tool Briefing Style

**AgentTool**: `"Brief the agent like a smart colleague who just walked into the room -- it hasn't seen this conversation, doesn't know what you've tried, doesn't understand why this task matters."`

> "Never delegate understanding. Don't write 'based on your findings, fix the bug' or 'based on the research, implement it.' Those phrases push synthesis onto the agent instead of doing it yourself."

**Gap**: These patterns are not replicated in our agentic tool definitions. The tools work but lack the behavioral guardrails.

---

## 8. Compaction Protocol (High Priority)

### Structure -- Exact Sections

CC's compaction prompt (`src/services/compact/prompt.ts`) produces a summary with these mandatory sections:

1. **Primary Request and Intent** (detailed)
2. **Key Technical Concepts** (list)
3. **Files and Code Sections** (with why important, code snippets)
4. **Errors and Fixes**
5. **Problem Solving** (approaches tried)
6. **All User Messages** (non-tool-result, verbatim or near-verbatim)
7. **Pending Tasks**
8. **Current Work** (precise description of where things stand)
9. **Optional Next Step** (with quotes from recent conversation)

Key rules:
> "CRITICAL: Respond with TEXT ONLY. Do NOT call any tools."
> Uses `<analysis>` block as drafting scratchpad (stripped before reaching context) + `<summary>` block for final output.

**Gap**: Our compression module (`packages/sdk/src/compression/`) does token-level dedup but not conversation-level compaction. When orchestrating long runs, we rely on the host harness for compaction. For Pi and other non-CC harnesses, there is no equivalent.

**Recommendation**: Implement a compaction prompt template in `packages/sdk/src/prompts/` that can be used to generate summary prompts for long-running orchestrations.

---

## 9. Memory Extraction Patterns (Medium Priority)

### Four-Type Memory Taxonomy

CC uses a structured memory system with four types:

1. **user**: Role, goals, preferences, knowledge (`"Great user memories help you tailor future behavior"`)
2. **feedback**: Corrections and confirmations (`"Record from failure AND success"`)
3. **project**: Ongoing work context (`"Always convert relative dates to absolute dates"`)
4. **reference**: Pointers to external systems (`"Where to find up-to-date information"`)

### Memory File Format
```markdown
---
name: {{memory name}}
description: {{one-line description}}
type: {{user, feedback, project, reference}}
---
{{memory content}}
```

Indexed in `MEMORY.md`: `- [Title](file.md) -- one-line hook` (<150 chars per entry)

**Gap**: Our profile system (`packages/sdk/src/profiles/`) stores user and project profiles but does not have the four-type taxonomy or the feedback/reference memory types. Our system does not extract and persist insights across runs.

---

## 10. Proactive/Autonomous Mode Instructions (Low Priority -- Future)

### Autonomous Agent Behavior

CC's proactive mode has detailed behavioral instructions:

> "You are running autonomously. You will receive `<tick>` prompts that keep you alive between turns."

Key behaviors:
- **Bias toward action**: `"Act on best judgment, not asking confirmation"`
- **Terminal focus calibration**: Unfocused (user away) = lean autonomous; Focused (user watching) = collaborate
- **Pacing**: Must call SLEEP if nothing useful to do
- **First wake-up**: Greet briefly and ask what to work on
- **Subsequent wake-ups**: Look for useful work, don't spam questions

### Brief Tool Protocol

> "Every user message gets a reply through Brief"
> "If need to investigate: ack first ('On it -- checking...'), then work, then result"

**Gap**: Our harness does not have an autonomous/proactive mode. Runs are explicitly triggered. This is aspirational but worth tracking for future platform capabilities.

---

## 11. Environment Context Assembly (Medium Priority)

### What CC Injects as Environment Context

CC injects the following runtime context into every prompt:

- Working directory (CWD)
- Is git repo: Yes/No
- Additional working directories
- Platform (win32, darwin, linux)
- Shell (bash/zsh with syntax note: "use Unix shell syntax, not Windows")
- OS Version
- Model name/ID with knowledge cutoff date
- Git worktree status (if applicable)
- Current date

**Gap**: Our `session:iteration-message` includes run context (run ID, iteration count, pending effects) but does not include platform, shell, git status, or model identity. When the delegated agent is Pi or another non-CC harness, it lacks this environmental awareness.

**Recommendation**: Enrich the iteration prompt with environment context from `packages/sdk/src/config/` and runtime detection.

---

## Summary: Priority Adoption Matrix

| # | Pattern | Priority | Effort | Impact |
|---|---------|----------|--------|--------|
| 1 | Coding Philosophy Instructions | High | S | Prevents over-engineering in non-CC harnesses |
| 2 | Tool Preference Rules | High | S | Reduces token waste from Bash misuse |
| 3 | Safety/Reversibility Framework | High | S | Prevents destructive actions in orchestrated tasks |
| 4 | Compaction Protocol | High | M | Enables long-running orchestrations |
| 5 | Output Efficiency Rules | Medium | S | Reduces token consumption |
| 6 | Git Operations Protocol | Medium | S | Prevents git mishaps in code tasks |
| 7 | Read-Before-Edit Enforcement | Medium | S | Prevents blind file overwrites |
| 8 | Agent Briefing Style | Medium | S | Improves delegated task quality |
| 9 | Environment Context Assembly | Medium | M | Platform-aware orchestration |
| 10 | Memory Taxonomy | Medium | L | Cross-run learning |
| 11 | Proactive Mode | Low | XL | Autonomous orchestration (future) |
| 12 | Prompt Priority Hierarchy | Medium | M | Composable prompt overlays |
