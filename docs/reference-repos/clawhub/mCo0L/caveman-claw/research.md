# mCo0L/caveman-claw

- **Archetype**: clawhub-plugin
- **Stars**: 3
- **Last pushed**: 2026-04-12
- **License**: MIT
- **Discovered**: 2026-04-12
- **Language**: TypeScript
- **Fork**: No

## Summary

Token cost reduction plugin for OpenClaw with two mechanisms: (1) Output mode -- instructs the AI to respond in terse, fragment-based style (same technical accuracy, fewer words), and (2) Auto-compression -- algorithmically trims older messages in conversation history before each request (strips articles, filler, synonyms shortened).

Activates globally by default on every new session. Tracks token savings via `/cc stats`. Simple, minimal approach -- no LLM calls, no vector databases, no external services.

## Assessment

LOW extractable value. The concept is simple and already partially covered by babysitter's compression layer. The "caveman mode" (terse AI output) is a prompt engineering technique, not a plugin architecture pattern. The auto-compression of older messages (article stripping, filler removal) is a basic NLP technique. Tracked for completeness but low priority.

**Extraction priority**: LOW

# Extractable Value: mCo0L/caveman-claw

## Processes

None.

## Plugin Ideas

### 1. Terse Mode Plugin
- **Category**: Context & Memory
- **install.md**: Installs a session-level toggle that instructs the AI to respond in terse, fragment-based style for token savings. Also algorithmically compresses older conversation history by stripping articles, filler words, and shortening synonyms. Tracks cumulative token savings.

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| N/A | N/A | No multi-step processes identified - terse mode is prompt engineering technique | - | N/A |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Terse Mode Toggle | POTENTIAL OVERLAP | Session-level terse response mode with conversation compression | babysitter compression system | plugins/a5c/marketplace/plugins/terse-mode-toggle/ |

## Implicit Procedural Knowledge

- **Dual-layer token reduction**: Combining output mode (prompt engineering for terse responses) with input compression (algorithmic trimming of history) addresses both sides of the token cost equation. Simple but effective for cost-sensitive environments.
- **Global-by-default activation**: The `globalByDefault` setting pattern -- plugin activates automatically on every new session unless explicitly disabled. Relevant for babysitter plugins that should be always-on.
