# Source Maps Skill

Expert skill for generating and consuming source maps for debugging compiled code.

## Quick Reference

- **Category**: Tooling
- **ID**: SK-015

## Key Capabilities

- Source map generation (V3 JSON, DWARF)
- Position mapping (generated to original)
- Inlined function handling
- Source map composition/chaining
- VLQ-encoded mappings
- Names array for identifiers
- Multi-file source map indices
- Debugger and stack trace integration

## When to Use

Use this skill when implementing:
- Debug information generation
- Source-to-source compilers
- Transpilers
- Stack trace symbolication

## Shared Candidate

This skill is a candidate for extraction to a shared library as it applies to:
- Web Development
- Mobile Development

## Related Skills

- llvm-backend (SK-005)
- dap-protocol (SK-013)
- jit-compilation (SK-011)
