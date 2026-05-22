# shareAI-lab/learn-claude-code

- **Archetype**: harness-framework (educational harness architecture)
- **Stars**: 52,165
- **Last pushed**: 2026-04-07
- **License**: MIT
- **Discovered**: 2026-04-12
- **Source**: gh-search (topic: claude-code)
- **Skills found**: 4 (pdf, code-review, mcp-builder, agent-builder)

## Summary
A "nano claude code-like agent harness" built from scratch in Python/Bash for educational purposes. Includes skills for PDF processing, code review, MCP server building, and agent building. The agent-builder skill contains a comprehensive agent design methodology: core philosophy ("the model already knows how to be an agent"), three elements (capabilities, knowledge, context), and design thinking framework.

## Assessment
HIGH VALUE. The agent-builder skill is a standout -- it contains a well-articulated agent design methodology that emphasizes simplicity and the model's inherent capability. The code-review skill and MCP-builder skill contain procedural workflows. The educational framing provides clear, extractable process definitions.

## Extraction Priority
HIGH -- The agent-builder methodology is directly extractable:
- Agent design thinking -> methodologies/ (agent architecture methodology)
- Code review skill -> already have code-review but may contain unique patterns
- MCP-builder -> specializations/shared/ (cross-domain MCP development process)

## Processes
1. **agent-design-thinking** -- Purpose -> Domain -> Capabilities (3-5 essential) -> Knowledge -> Context analysis
2. **agent-build-loop** -- The core agent loop: context + capabilities -> decide -> act or respond
3. **mcp-server-development** -- Process for building MCP servers from scratch
4. **code-review-workflow** -- Structured code review process

## Plugin Ideas
None specific -- methodology content, not tool integration.

## Harness Integration Ideas

### Educational Architecture Patterns
- **Current limitation**: Limited documentation of harness architecture principles
- **Integration approach**: Use educational patterns to improve babysitter harness documentation and architecture understanding
- **Implementation scope**: Internal documentation, architecture refinement, team education

### Agent Loop Optimization
- **Current limitation**: Could benefit from clearer agent loop architecture documentation
- **Integration approach**: Apply educational agent loop patterns to babysitter runtime documentation
- **Implementation scope**: `packages/sdk/src/runtime/`, improved loop architecture

### Permission System Enhancement
- **Current limitation**: Limited safety validation patterns for model intent execution
- **Integration approach**: Study permission layer patterns for agent execution safety
- **Implementation scope**: `packages/sdk/src/security/`, model intent validation

## Implicit Procedural Knowledge
- "Start with 3-5 capabilities, add more only when agent consistently fails" -- capability minimalism principle
- "Make knowledge available, not mandatory. Load when relevant, not upfront" -- lazy knowledge loading
- "Context is precious. Isolate noisy subtasks. Truncate verbose outputs. Protect clarity" -- context hygiene
- The agent loop distilled to its simplest form
- "The model does the reasoning. The harness gives the model a working environment" -- fundamental harness philosophy

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Agent Design Thinking Methodology | NEW | Purpose → Domain → Capabilities → Knowledge → Context analysis methodology | - | methodologies/agent-design-thinking/ |
| Agent Build Loop Process | NEW | Core agent loop: context + capabilities → decide → act or respond | - | specializations/shared/agent-build-loop.js |
| MCP Server Development Process | NEW | Process for building MCP servers from scratch with structured workflow | - | specializations/shared/mcp-server-development.js |
| Code Review Workflow | EXISTING | Structured code review process | specializations/shared/code-review.js | specializations/shared/code-review-workflow.js |
| Capability Minimalism Process | NEW | Start with 3-5 capabilities, add more only when agent consistently fails | - | specializations/shared/capability-minimalism.js |
| Lazy Knowledge Loading | NEW | Make knowledge available, not mandatory; load when relevant, not upfront | - | specializations/shared/lazy-knowledge-loading.js |
| Context Hygiene Process | NEW | Context management: isolate noisy subtasks, truncate verbose outputs, protect clarity | - | specializations/shared/context-hygiene.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agent Design Assistant | NEW | Educational agent design methodology with capability minimalism and context hygiene principles | - | plugins/a5c/marketplace/plugins/agent-design-assistant/ |
| MCP Development Suite | NEW | MCP server development toolkit with structured workflow and educational patterns | - | plugins/a5c/marketplace/plugins/mcp-development-suite/ |
| Educational Harness Framework | NEW | Simplified harness architecture patterns for learning and documentation | - | plugins/a5c/marketplace/plugins/educational-harness-framework/ |
