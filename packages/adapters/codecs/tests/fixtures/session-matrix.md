# Session Fixture Matrix

`session-matrix.json` is the stable fixture source for the unified persistent-session adapter contract.

The matrix covers claude-code, codex, pi, gemini, opencode, and one plugin-generated target. Each target includes a native session ID, expected unified ID, native storage strategy, timestamps, cwd metadata, resume-relevant identifiers, native-shaped records, and expected normalized summary fields.

Fixture rules:

- Keep records synthetic and redacted.
- Preserve native shape enough for parser and registry contract tests.
- Do not include secrets, private absolute paths, hostnames, account IDs, or real prompts.
- Keep malformed input represented in the matrix so list paths prove they skip unparseable content.
- Use Atlas `SessionSemantics` and `PluginTarget` names for target IDs and adapter aliases.
