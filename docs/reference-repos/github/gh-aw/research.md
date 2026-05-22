# github/gh-aw

- **Archetype**: harness-framework
- **Stars**: 4,288
- **Last pushed**: 2026-04-13
- **License**: MIT
- **Discovered**: 2026-04-13
- **Source**: backlog-processing
- **Skills found**: 22 (console-rendering, custom-agents, developer, dictation, documentation, error-messages, error-pattern-safety, error-recovery-patterns, gh-agent-session, gh-agent-task, github-copilot-agent-tips-and-tricks, github-discussion-query, github-issue-query, github-mcp-server, github-pr-query, github-script, http-mcp-headers, javascript-refactoring, messages, reporting, skillz-integration, temporary-id-safe-output)

## Summary
GitHub's official "Agentic Workflows" framework that enables writing agent workflows in natural language markdown and executing them in GitHub Actions. Built in Go with comprehensive CLI tooling, includes 22 skills covering GitHub automation, error recovery patterns, MCP server integration, agent sessions, and safety guardrails. Provides a complete harness for agentic GitHub automation with production-ready error handling and recovery strategies.

## Assessment
VERY HIGH VALUE. This is GitHub's authoritative framework for agentic workflow orchestration with substantial procedural knowledge. The error recovery patterns are particularly valuable - containing circuit breaker implementations, exponential backoff strategies, and systematic debugging approaches. The GitHub automation skills encode official patterns for issue/PR queries, discussion management, and MCP server integration. The safety and guardrail patterns are directly applicable to babysitter's breakpoint and validation systems.

## Extraction Priority
VERY HIGH - Contains official GitHub workflow orchestration patterns that are directly transferable:
- Error recovery and retry patterns -> specializations/shared/
- Agentic workflow orchestration -> methodologies/agentic-workflows/
- GitHub automation processes -> specializations/devops-sre-platform/
- Safety and guardrail patterns -> specializations/shared/

## Skills Inventory

| Skill | Path | Domain | Transferable? | Notes |
|-------|------|--------|---------------|-------|
| error-recovery-patterns | skills/error-recovery-patterns/ | Shared | Yes - process | Circuit breaker, exponential backoff, retry strategies |
| error-pattern-safety | skills/error-pattern-safety/ | Shared | Yes - process | Error classification and safety guardrails |
| gh-agent-session | skills/gh-agent-session/ | DevOps | Yes - process | Agent session management and lifecycle |
| github-mcp-server | skills/github-mcp-server/ | DevOps | Yes - process | MCP server integration patterns |
| github-issue-query | skills/github-issue-query/ | DevOps | Yes - pattern | Systematic issue query and management |
| github-pr-query | skills/github-pr-query/ | DevOps | Yes - pattern | Pull request automation workflows |
| custom-agents | skills/custom-agents/ | Shared | Yes - methodology | Agent customization and configuration patterns |

## Processes
- **error-recovery-pipeline**: Comprehensive error handling with circuit breakers and exponential backoff
  - Source: skills/error-recovery-patterns/SKILL.md (lines 25-50)
  - Placement: specializations/shared/
  - Inputs: Operation type, failure modes, retry constraints
  - Outputs: Recovery strategy, retry configuration, circuit breaker setup
  - Complexity: complex
  - Notes: Reduces retry loops to <10%, includes fail-fast for non-transient errors

- **agentic-workflow-orchestration**: Process for designing and executing natural language agent workflows
  - Source: Overall framework design and documentation
  - Placement: methodologies/agentic-workflows/
  - Inputs: Workflow requirements, safety constraints, execution environment
  - Outputs: Workflow definition, execution plan, safety guardrails
  - Complexity: complex

- **github-automation-pipeline**: Systematic approach to GitHub repository automation
  - Source: github-issue-query, github-pr-query, github-discussion-query skills
  - Placement: specializations/devops-sre-platform/
  - Inputs: Repository, automation requirements, API access
  - Outputs: Automation scripts, query patterns, integration configuration
  - Complexity: moderate

## Plugin Ideas
- **agentic-github-workflows**: Complete GitHub workflow automation setup
  - What install.md would do: Install GitHub CLI, configure agentic workflows, set up error recovery patterns, create GitHub Actions templates
  - Processes it would copy: error-recovery-pipeline, github-automation-pipeline, agentic-workflow-orchestration
  - Configs/hooks it would create: GitHub Actions workflows, error recovery configs, safety guardrails, MCP server configurations
  - Source evidence: Complete framework with 22 skills for GitHub automation and agentic workflows

- **error-recovery-suite**: Robust error handling and recovery infrastructure
  - What install.md would do: Install circuit breaker libraries, configure retry patterns, set up monitoring for failure rates
  - Processes it would copy: error-recovery-pipeline, error-classification-process
  - Configs/hooks it would create: Retry configurations, circuit breaker settings, error monitoring dashboards
  - Source evidence: Comprehensive error recovery skills with production metrics (target <10% retry loops)

## Harness Integration Ideas

### Harness Adapter for GitHub Agentic Workflows

**Capability Assessment for Babysitter Integration:**

| Capability | Status | Details |
|------------|---------|---------|
| **Custom Tools/MCP** | ✅ EXCELLENT | Comprehensive tool suite: bash execution, GitHub API, MCP servers, Playwright, memory systems, QMD search. Custom MCP server integration via stdio/Docker/HTTP |
| **Stop Hooks** | ❌ NOT SUPPORTED | Tool timeouts exist but **no lifecycle/interruption mechanisms documented**. No shutdown callbacks, graceful termination, or pause/resume functionality |
| **Plugin System** | ✅ SUPPORTED | MCP-based extension system with server registration, tool whitelisting, environment injection. Microsoft APM (Agent Package Manager) for cross-agent dependencies |

**Integration Viability:** PARTIAL - Excellent tool ecosystem and MCP integration but **completely lacks stop hooks** needed for babysitter's orchestration interruption model.

- **Adapter implementation**: `createGhAwAdapter` in `packages/sdk/src/harness/adapters/`
- **Plugin structure**: `plugins/babysitter-gh-aw/` for GitHub Agentic Workflows integration
- **CLI integration**: `gh aw` command patterns, workflow execution, agent session management
- **Major limitation**: **No interruption mechanisms** - would require custom workflow pause/resume implementation

### TUI/Orchestration Improvement: Agentic Workflow Patterns
- **Current limitation**: Our harness lacks natural language workflow definition and GitHub Actions integration
- **Integration approach**: Adapt GitHub's agentic workflow patterns for babysitter process orchestration
- **Implementation scope**: `packages/sdk/src/runtime/`, workflow definition language, GitHub integration

## Implicit Procedural Knowledge
- **Error Classification and Recovery Strategy**: Systematic approach to categorizing errors as transient vs non-transient and applying appropriate recovery patterns
  - Source: error-recovery-patterns and error-pattern-safety skills
  - Placement: specializations/shared/
  - Why codify: Provides reusable framework for robust error handling across all types of automation
  - Sketch: Error detection -> Classification (transient/non-transient) -> Recovery strategy selection -> Circuit breaker implementation -> Monitoring and adjustment

- **Agentic Workflow Design Methodology**: Process for translating natural language requirements into executable agent workflows with safety guardrails
  - Source: Overall framework architecture and custom-agents skill
  - Placement: methodologies/agentic-workflows/
  - Why codify: Systematic approach to agent workflow design that's applicable beyond GitHub automation
  - Sketch: Requirement analysis -> Natural language workflow definition -> Safety constraint identification -> Execution environment setup -> Guardrail implementation -> Testing and validation

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| Error Recovery Pipeline | NEW | Comprehensive error handling with circuit breakers and exponential backoff | - | specializations/shared/error-recovery-pipeline.js |
| Agentic Workflow Orchestration | NEW | Natural language agent workflow design and execution with safety guardrails | - | methodologies/agentic-workflow-orchestration/ |
| GitHub Automation Pipeline | NEW | Systematic GitHub repository automation with issue/PR query patterns | - | specializations/devops-sre-platform/github-automation-pipeline.js |
| Error Classification and Recovery Strategy | NEW | Systematic error categorization (transient/non-transient) with appropriate recovery patterns | - | specializations/shared/error-classification-recovery.js |
| Agentic Workflow Design Methodology | NEW | Translation of natural language requirements into executable agent workflows | - | methodologies/agentic-workflow-design/ |
| Agent Session Management | NEW | Agent session lifecycle management with GitHub integration patterns | - | specializations/shared/agent-session-management.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| Agentic GitHub Workflows | UPGRADE | Complete GitHub workflow automation beyond existing github-actions-cicd plugins | plugins/a5c/marketplace/plugins/github-actions-cicd-* | plugins/a5c/marketplace/plugins/agentic-github-workflows/ |
| Error Recovery Suite | NEW | Robust error handling and recovery infrastructure with circuit breakers and monitoring | - | plugins/a5c/marketplace/plugins/error-recovery-suite/ |