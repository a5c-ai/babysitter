# Performance Optimization - Skills and Agents References

This document catalogs community-created Claude skills, agents, plugins, MCP servers, and related tools that align with the skills and agents identified in the Performance Optimization backlog. These external resources can accelerate implementation and provide integration patterns.

---

## Table of Contents

1. [Overview](#overview)
2. [Profiling and Flame Graphs](#profiling-and-flame-graphs)
3. [Continuous Profiling](#continuous-profiling)
4. [APM and Observability](#apm-and-observability)
5. [Load Testing](#load-testing)
6. [Database Performance](#database-performance)
7. [Caching and Redis](#caching-and-redis)
8. [Monitoring and Metrics](#monitoring-and-metrics)
9. [Runtime-Specific Profiling](#runtime-specific-profiling)
10. [Container and Kubernetes](#container-and-kubernetes)
11. [Error Monitoring](#error-monitoring)
12. [General Developer Tools](#general-developer-tools)
13. [Awesome Lists and Directories](#awesome-lists-and-directories)
14. [Skill-to-Reference Mapping](#skill-to-reference-mapping)

---

## Overview

### Search Sources
- GitHub Topics: claude-skills, mcp-servers, performance-optimization
- Awesome Lists: awesome-claude-skills, awesome-claude-code-plugins, awesome-mcp-servers
- Official Documentation: Anthropic, Grafana, Datadog, Sentry
- Community Blogs and Tutorials

### Reference Categories
| Category | References Found |
|----------|-----------------|
| Profiling and Flame Graphs | 4 |
| Continuous Profiling | 3 |
| APM and Observability | 8 |
| Load Testing | 3 |
| Database Performance | 6 |
| Caching and Redis | 2 |
| Monitoring and Metrics | 6 |
| Runtime-Specific Profiling | 2 |
| Container and Kubernetes | 6 |
| Error Monitoring | 2 |
| General Developer Tools | 5 |
| **Total** | **47** |

---

## Profiling and Flame Graphs

### REF-001: pprof-analyzer MCP Server
**Relevant Skills**: SK-001 (Flame Graph Generation), SK-019 (Go pprof)

| Field | Value |
|-------|-------|
| URL | https://skywork.ai/skypage/en/go-performance-ai-pprof-analyzer/1980849175509139456 |
| Type | MCP Server |
| Language | Go |
| Description | Specialized MCP server that exposes `go tool pprof` to AI agents. Converts natural language requests into pprof commands and returns structured results. Includes `analyze_pprof` and `generate_flamegraph` tools. |
| Claude Code Setup | `claude mcp add-json "pprof-analyzer" '{"command":"pprof-analyzer-mcp"}'` |
| Downloads | 5,100+ (as of April 2025) |

### REF-002: Polar Signals Cloud MCP
**Relevant Skills**: SK-001 (Flame Graph Generation), SK-014 (Pyroscope/Continuous Profiling)

| Field | Value |
|-------|-------|
| URL | https://www.polarsignals.com/blog/posts/2025/07/17/the-mcp-for-performance-engineering |
| Type | MCP Server (Remote) |
| Description | MCP integration for Polar Signals Cloud continuous profiling platform. Enables Claude to analyze actual production profiles, identify bottlenecks, and suggest code-specific optimizations based on real profiling data. |
| Features | Production profile analysis, code correlation, flame graph interpretation |

### REF-003: Grafana AI Flamegraph Interpreter
**Relevant Skills**: SK-001 (Flame Graph Generation), SK-014 (Pyroscope)

| Field | Value |
|-------|-------|
| URL | https://pyroscope.io/blog/ai-powered-flamegraph-interpreter/ |
| Type | Grafana Integration |
| Description | AI-powered flame graph analysis built into Grafana Pyroscope. Achieved 100% accuracy in testing, consistently outperforming beginners and advanced users in flame graph interpretation. |
| Features | Automated flamegraph interpretation, performance recommendations |

### REF-004: FlameGraph Scripts (Reference Tool)
**Relevant Skills**: SK-001 (Flame Graph Generation)

| Field | Value |
|-------|-------|
| URL | https://github.com/brendangregg/FlameGraph |
| Type | CLI Tool |
| Description | Brendan Gregg's original FlameGraph scripts. Foundation for flame graph generation from perf, dtrace, async-profiler data. Used by many MCP servers and profiling tools. |
| Features | SVG generation, differential flame graphs, off-CPU analysis |

---

## Continuous Profiling

### REF-005: Grafana Pyroscope
**Relevant Skills**: SK-014 (Pyroscope Continuous Profiling)

| Field | Value |
|-------|-------|
| URL | https://github.com/grafana/pyroscope |
| Type | Platform |
| Description | Open source continuous profiling platform. Surfaces performance insights, optimizes CPU, memory, and I/O usage. Integrated with Grafana ecosystem and supports MCP via Grafana MCP server. |
| GitHub Integration | Line-by-line code performance visualization |
| AI Features | AI-powered flamegraph interpreter |

### REF-006: Grafana MCP Server (Pyroscope Support)
**Relevant Skills**: SK-014 (Pyroscope), SK-015 (Prometheus Metrics)

| Field | Value |
|-------|-------|
| URL | https://github.com/grafana/mcp-grafana |
| Type | MCP Server |
| Stars | 2,100+ |
| Description | Official Grafana MCP server. Queries Prometheus metadata, integrates with Pyroscope for profiling data, supports dashboard search and incident investigation. |
| Features | PromQL queries, datasource access, incident management, tracing data |
| Read-only Mode | `--disable-write` flag for safe AI access |

### REF-007: Grafana Cloud Traces MCP
**Relevant Skills**: SK-013 (OpenTelemetry), SK-014 (Continuous Profiling)

| Field | Value |
|-------|-------|
| URL | https://grafana.com/docs/grafana-cloud/send-data/traces/mcp-server/ |
| Documentation | https://grafana.com/blog/llm-powered-insights-into-your-tracing-data-introducing-mcp-support-in-grafana-cloud-traces/ |
| Type | MCP Server (Cloud) |
| Description | LLM-powered tracing data analysis. Enables natural language exploration of service interactions and distributed traces. |
| Features | Service dependency analysis, trace exploration, onboarding assistance |

---

## APM and Observability

### REF-008: Datadog MCP Server
**Relevant Skills**: SK-011 (Datadog APM)

| Field | Value |
|-------|-------|
| URL | https://docs.datadoghq.com/bits_ai/mcp_server/ |
| Composio Integration | https://composio.dev/toolkits/datadog/framework/claude-agents-sdk |
| Type | MCP Server |
| Description | Official Datadog MCP Server. Bridge between observability data and AI agents supporting MCP. |
| Capabilities | Service dependency mapping, trace retrieval, APM service listing, trace search |

### REF-009: winor30/mcp-server-datadog
**Relevant Skills**: SK-011 (Datadog APM)

| Field | Value |
|-------|-------|
| URL | https://github.com/winor30/mcp-server-datadog |
| Type | MCP Server |
| Description | Community MCP server for Datadog integration. Facilitates incident management and observability through Claude. |
| Features | Incident management, monitoring integration |

### REF-010: Claude Telemetry (OpenTelemetry Wrapper)
**Relevant Skills**: SK-013 (OpenTelemetry)

| Field | Value |
|-------|-------|
| URL | https://github.com/TechNickAI/claude_telemetry |
| Type | CLI Wrapper |
| Description | OpenTelemetry wrapper for Claude Code CLI. Logs tool calls, token usage, costs, and execution traces to various backends. Drop-in replacement using `claudia` command. |
| Backends | Logfire, Sentry, Honeycomb, Datadog, Grafana |
| Features | OTLP export, automatic settings loading, MCP server support |

### REF-011: SigNoz Claude Code Monitoring
**Relevant Skills**: SK-013 (OpenTelemetry)

| Field | Value |
|-------|-------|
| URL | https://signoz.io/blog/claude-code-monitoring-with-opentelemetry/ |
| Type | Guide/Integration |
| Description | Comprehensive guide for implementing OpenTelemetry observability for Claude Code activity using SigNoz backend. |
| Features | Activity monitoring, performance tracking |

### REF-012: Observability 3.0 AI-Powered APM Guide
**Relevant Skills**: SK-011-013 (APM), SK-015 (Prometheus)

| Field | Value |
|-------|-------|
| URL | https://cmakkaya.medium.com/observability-3-0-ai-powered-apm-claude-cloud-based-ollama-self-hosted-mcp-server-n8n-monitor-6ea436e271fe |
| Type | Tutorial |
| Description | Comprehensive guide combining Claude/Ollama with MCP Server, n8n, Prometheus, Grafana, Loki, Tempo, and OpenTelemetry for AI-powered APM. |
| Stack | Prometheus, Grafana, Loki, Tempo, OTel, PostgreSQL Exporter, Node Exporter, cAdvisor |

### REF-013: Dynatrace MCP Server
**Relevant Skills**: AG-007 (APM/Observability Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/dynatrace-oss/dynatrace-mcp |
| Type | MCP Server |
| Description | MCP server for Dynatrace Observability monitoring. AI-powered insights into application performance and infrastructure health. |
| Source | awesome-devops-mcp-servers |

### REF-014: Last9 MCP Server
**Relevant Skills**: AG-007 (APM/Observability Expert)

| Field | Value |
|-------|-------|
| URL | Listed in awesome-devops-mcp-servers |
| Type | MCP Server |
| Description | Last9 MCP Server for observability and monitoring. Provides AI assistants access to metrics, logs, and traces. |

### REF-015: Tempo MCP Server
**Relevant Skills**: SK-013 (OpenTelemetry), AG-007 (APM Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/scottlepp/tempo-mcp-server |
| Type | MCP Server |
| Description | Enables AI assistants to query and analyze distributed tracing data from Grafana Tempo using MCP. |
| Features | Trace querying, distributed tracing analysis |

---

## Load Testing

### REF-016: Locust MCP Server
**Relevant Skills**: SK-005 (k6 Load Testing), SK-006 (Gatling), AG-005 (Load Testing Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/QAInsights/locust-mcp-server |
| Type | MCP Server |
| Description | MCP server implementation for running Locust load tests. Seamless integration with AI-powered development environments. |
| Tool | `run_locust` with configurable host, users, spawn rate, runtime |
| Config | LOCUST_HOST, LOCUST_USERS, LOCUST_SPAWN_RATE, LOCUST_RUN_TIME |

### REF-017: Playwright MCP Server
**Relevant Skills**: Related to load testing scenarios, AG-005 (Load Testing Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/microsoft/playwright-mcp |
| Type | MCP Server |
| Description | Microsoft's official Playwright MCP server. Supports browser testing, bug detection, and test code generation. Can integrate with Locust for UI load testing via locust-plugins. |
| Features | Persistent profile mode, isolated contexts, browser extension connection |

### REF-018: LangSmith Fetch (Trace Analysis)
**Relevant Skills**: Related to load test debugging and trace analysis

| Field | Value |
|-------|-------|
| URL | https://github.com/ComposioHQ/awesome-claude-skills/blob/master/langsmith-fetch |
| Type | Claude Skill |
| Description | First AI observability skill for Claude Code. Debug LangChain and LangGraph agents by fetching and analyzing execution traces from LangSmith Studio. |
| Use Case | Performance analysis of AI agent workflows |

---

## Database Performance

### REF-019: Postgres MCP Pro
**Relevant Skills**: SK-009 (SQL Query Analysis), AG-004 (Database Performance Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/crystaldba/postgres-mcp |
| Type | MCP Server |
| Description | Comprehensive PostgreSQL MCP with performance analysis. Supports read/write modes, execution plan analysis, index recommendations, and health checks. |
| Key Tools | Query execution plans, hypothetical index simulation, workload analysis, index recommendations |
| Health Checks | Buffer cache hit rates, connection health, constraint validation, index health, vacuum health |

### REF-020: postgresql-mcp
**Relevant Skills**: SK-009 (SQL Query Analysis)

| Field | Value |
|-------|-------|
| URL | https://github.com/sgaunet/postgresql-mcp |
| Type | MCP Server |
| Description | PostgreSQL integration for Claude Code with focus on security. Read-only operations, parameterized queries, SQL injection protection. |
| Features | List databases/schemas/tables, describe tables, execute queries, list indexes with usage stats, explain query |

### REF-021: db-analyzer-mcp
**Relevant Skills**: SK-009 (SQL Query Analysis), AG-004 (Database Performance Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/ariburaco/db-analyzer-mcp |
| Type | MCP Server |
| Description | Database analyzer MCP with PostgreSQL primary support. Architecture ready for MySQL/SQLite expansion. |
| Features | Project-local config, cached schema, performance analysis |

### REF-022: mcp-server-mysql
**Relevant Skills**: SK-009 (SQL Query Analysis)

| Field | Value |
|-------|-------|
| URL | https://github.com/benborla/mcp-server-mysql |
| Type | MCP Server |
| Description | MySQL database MCP server enabling schema inspection and secure query execution. Optimized for Claude Code CLI. |
| Features | SSH tunnel support, auto-start/stop hooks, DDL operations |

### REF-023: MCP Alchemy
**Relevant Skills**: SK-009 (SQL Query Analysis)

| Field | Value |
|-------|-------|
| URL | https://github.com/runekaagaard/mcp-alchemy |
| Type | MCP Server |
| Description | Multi-database MCP server using SQLAlchemy. Supports PostgreSQL, MySQL, MariaDB, SQLite, Oracle, MS SQL Server, CrateDB, Vertica. |
| Use Case | Cross-database performance analysis and query optimization |

### REF-024: PostgreSQL Skill
**Relevant Skills**: SK-009 (SQL Query Analysis)

| Field | Value |
|-------|-------|
| URL | https://github.com/sanjay3290/ai-skills/tree/main/skills/postgres |
| Type | Claude Skill |
| Description | Execute read-only SQL queries against databases for performance analysis and monitoring. |
| Source | awesome-claude-skills |

---

## Caching and Redis

### REF-025: Redis MCP Server (Official)
**Relevant Skills**: SK-010 (Redis/Memcached Caching)

| Field | Value |
|-------|-------|
| URL | https://github.com/redis/mcp-redis |
| Blog | https://redis.io/blog/introducing-model-context-protocol-mcp-for-redis/ |
| Type | MCP Server |
| Description | Official Redis MCP Server. Natural language interface for managing and searching data in Redis. Supports all Redis data structures. |
| Use Cases | Session management, conversation history, real-time caching, rate limiting, recommendations, RAG semantic search |
| Data Types | Strings, hashes, JSON documents, lists, sets, sorted sets, vector embeddings |

### REF-026: Redis Cloud Admin API MCP
**Relevant Skills**: SK-010 (Redis/Memcached Caching), AG-006 (Caching Architect)

| Field | Value |
|-------|-------|
| URL | Referenced in Redis blog |
| Type | MCP Server |
| Description | Natural-language Redis Cloud administrator. Query subscriptions and deploy new databases through conversational interface. |
| Features | Subscription management, database deployment |

---

## Monitoring and Metrics

### REF-027: Prometheus MCP Server
**Relevant Skills**: SK-015 (Prometheus Metrics)

| Field | Value |
|-------|-------|
| URL | https://github.com/pab1it0/prometheus-mcp-server |
| Type | MCP Server |
| Stars | 340+ |
| Description | MCP server enabling AI agents to query and analyze Prometheus metrics through standardized interfaces. |
| Requirements | Prometheus server, MCP-compatible client |

### REF-028: DrDroidLab Grafana MCP Server
**Relevant Skills**: SK-015 (Prometheus Metrics)

| Field | Value |
|-------|-------|
| URL | https://github.com/DrDroidLab/grafana-mcp-server |
| Type | MCP Server |
| Description | Execute PromQL queries against Grafana's Prometheus datasource. Optimizes time series responses to reduce token size. |
| Tool | `grafana_promql_query` |

### REF-029: VictoriaMetrics MCP Server
**Relevant Skills**: SK-015 (Prometheus Metrics)

| Field | Value |
|-------|-------|
| URL | https://github.com/VictoriaMetrics-Community/mcp-victoriametrics |
| Type | MCP Server |
| Stars | 110+ |
| Description | Comprehensive integration with VictoriaMetrics instance APIs for monitoring. |
| Source | best-of-mcp-servers |

### REF-030: seekrays/mcp-monitor
**Relevant Skills**: SK-015 (Prometheus Metrics), AG-011 (I/O Performance Expert)

| Field | Value |
|-------|-------|
| URL | https://github.com/seekrays/mcp-monitor |
| Type | MCP Server |
| Description | System monitoring tool for real-time metrics on CPU, memory, disk, network, hosts, and processes. |
| Source | awesome-devops-mcp |

### REF-031: Lumino MCP Server (SRE Observability)
**Relevant Skills**: AG-001 (Performance Engineer), AG-007 (APM Expert)

| Field | Value |
|-------|-------|
| URL | Listed in awesome-mcp-servers (spre-sre/lumino-mcp-server) |
| Type | MCP Server |
| Description | AI-powered SRE observability for Kubernetes and OpenShift. 40+ tools for Tekton pipeline debugging, log analysis, root cause analysis, and predictive monitoring. |

### REF-032: Opik MCP (LLM Observability)
**Relevant Skills**: Related to performance monitoring of AI systems

| Field | Value |
|-------|-------|
| URL | Listed in awesome-mcp-servers (Comet-ML/Opik-MCP) |
| Type | MCP Server |
| Description | Natural language exploration of LLM observability, traces, and monitoring data captured by Opik. |

---

## Runtime-Specific Profiling

### REF-033: async-profiler
**Relevant Skills**: SK-002 (JVM Profiling)

| Field | Value |
|-------|-------|
| URL | https://github.com/async-profiler/async-profiler |
| Type | Profiling Tool |
| Description | Low overhead sampling CPU and heap profiler for Java. Uses AsyncGetCallTrace + perf_events. Avoids Safepoint bias problem. |
| Features | CPU profiling, heap profiling, native memory mode (v4.0), JFR/pprof export |
| Integration | Bundled with IntelliJ IDEA Ultimate 2018.3+ |

### REF-034: Clinic.js
**Relevant Skills**: SK-017 (MemLab), SK-018 (Node.js Profiling)

| Field | Value |
|-------|-------|
| URL | https://github.com/clinicjs/node-clinic |
| Website | https://clinicjs.org/ |
| Type | Profiling Suite |
| Description | Open Source Node.js performance profiling suite by NearForm. Includes Doctor, Flame, Bubbleprof tools. |
| Features | Memory leak detection, event loop analysis, automatic issue type detection |
| Limitation | Not suitable for extended profiling sessions (1+ hours) |

---

## Container and Kubernetes

### REF-035: containers/kubernetes-mcp-server
**Relevant Skills**: Related to performance debugging in containerized environments

| Field | Value |
|-------|-------|
| URL | https://github.com/containers/kubernetes-mcp-server |
| Type | MCP Server |
| Description | MCP server for Kubernetes and OpenShift. Supports read-only mode for safe debugging and inspection. |
| Demo | Automatic deployment diagnosis and fixing in OpenShift |

### REF-036: Azure/mcp-kubernetes
**Relevant Skills**: Related to performance debugging in containerized environments

| Field | Value |
|-------|-------|
| URL | https://github.com/Azure/mcp-kubernetes |
| Type | MCP Server |
| Description | Bridge between AI tools (Claude, Cursor, GitHub Copilot) and Kubernetes. Debugging and monitoring capabilities including log viewing and pod command execution. |
| Features | Hubble commands for network monitoring in Cilium-enabled clusters |

### REF-037: Flux159/mcp-server-kubernetes
**Relevant Skills**: Related to performance debugging in containerized environments

| Field | Value |
|-------|-------|
| URL | https://github.com/Flux159/mcp-server-kubernetes |
| Type | MCP Server |
| Description | Kubernetes management with troubleshooting prompts. Cleans up problematic pods, provides systematic troubleshooting flow. |
| Features | Non-destructive mode, secrets masking, diagnostic prompts |

### REF-038: Docker MCP Server
**Relevant Skills**: Related to container performance monitoring

| Field | Value |
|-------|-------|
| URL | https://github.com/QuantGeekDev/docker-mcp |
| Type | MCP Server |
| Description | Docker MCP server for container management through Claude. |

### REF-039: Docker MCP Toolkit
**Relevant Skills**: Related to container performance monitoring

| Field | Value |
|-------|-------|
| URL | https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/ |
| Type | Integration Tool |
| Description | Connect MCP servers to Claude Desktop/Claude Code with Docker. Enables Kubernetes management, Helm charts through Claude. |

### REF-040: Homelab MCP
**Relevant Skills**: Related to infrastructure monitoring

| Field | Value |
|-------|-------|
| URL | https://github.com/bjeans/homelab-mcp |
| Type | MCP Server Collection |
| Description | MCP servers for homelab infrastructure management. Monitor Docker/Podman containers, includes security checks and templates. |

---

## Error Monitoring

### REF-041: Sentry MCP Server
**Relevant Skills**: Related to performance error tracking

| Field | Value |
|-------|-------|
| URL | https://github.com/getsentry/sentry-mcp |
| Documentation | https://docs.sentry.io/product/sentry-mcp/ |
| Type | MCP Server |
| Stars | 510+ |
| Description | Remote MCP server for Sentry API interaction. Optimized for coding assistants. Error tracking and performance monitoring. |
| Claude Code Setup | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| Features | Issue analysis, performance monitoring, error-rate correlation, regression detection |

### REF-042: Sentry for Claude
**Relevant Skills**: Related to performance error tracking

| Field | Value |
|-------|-------|
| URL | https://github.com/getsentry/sentry-for-claude |
| Type | Claude Plugin |
| Description | Official Sentry integration plugin for Claude Code. Includes MCP tools, Code Review tools, AI Agent Monitoring setup. |
| Commands | `/seer` for natural language queries about errors and performance |

---

## General Developer Tools

### REF-043: D3.js Visualization Skill
**Relevant Skills**: Related to performance data visualization

| Field | Value |
|-------|-------|
| URL | https://github.com/chrisvoncsefalvay/claude-d3js-skill |
| Type | Claude Skill |
| Description | Enables Claude to produce D3 charts and interactive data visualizations. Useful for performance metrics and analytics visualization. |
| Source | awesome-claude-skills |

### REF-044: CSV Data Summarizer
**Relevant Skills**: Related to benchmark data analysis

| Field | Value |
|-------|-------|
| URL | https://github.com/coffeefuelbump/csv-data-summarizer-claude-skill |
| Type | Claude Skill |
| Description | Automatically analyzes CSV files and generates comprehensive insights with visualizations. Useful for benchmark data analysis. |
| Source | awesome-claude-skills |

### REF-045: performance-benchmarker Plugin
**Relevant Skills**: SK-007 (JMH), SK-008 (BenchmarkDotNet), AG-010 (Benchmarking Expert)

| Field | Value |
|-------|-------|
| URL | Listed in awesome-claude-code-plugins |
| Type | Claude Code Plugin |
| Description | Benchmarking and performance measurement capabilities. |
| Source | ccplugins/awesome-claude-code-plugins |

### REF-046: monitoring-observability-specialist Plugin
**Relevant Skills**: AG-007 (APM/Observability Expert)

| Field | Value |
|-------|-------|
| URL | Listed in awesome-claude-code-plugins |
| Type | Claude Code Plugin/Agent |
| Description | Dedicated agent for monitoring and observability tasks. |
| Source | ccplugins/awesome-claude-code-plugins |

### REF-047: database-performance-optimizer Plugin
**Relevant Skills**: AG-004 (Database Performance Expert)

| Field | Value |
|-------|-------|
| URL | Listed in awesome-claude-code-plugins |
| Type | Claude Code Plugin |
| Description | Database performance optimization tools. |
| Source | ccplugins/awesome-claude-code-plugins |

---

## Awesome Lists and Directories

### Directory Resources

| Name | URL | Focus |
|------|-----|-------|
| punkpeye/awesome-mcp-servers | https://github.com/punkpeye/awesome-mcp-servers | General MCP servers |
| rohitg00/awesome-devops-mcp-servers | https://github.com/rohitg00/awesome-devops-mcp-servers | DevOps-focused MCP servers |
| tolkonepiu/best-of-mcp-servers | https://github.com/tolkonepiu/best-of-mcp-servers | Ranked MCP servers (weekly updates) |
| TensorBlock/awesome-mcp-servers | https://github.com/TensorBlock/awesome-mcp-servers | Categorized (includes monitoring section) |
| agenticdevops/awesome-devops-mcp | https://github.com/agenticdevops/awesome-devops-mcp | AIOps and DevOps MCP servers |
| ComposioHQ/awesome-claude-skills | https://github.com/ComposioHQ/awesome-claude-skills | Claude skills directory |
| ccplugins/awesome-claude-code-plugins | https://github.com/ccplugins/awesome-claude-code-plugins | Claude Code plugins |

---

## Skill-to-Reference Mapping

### Skills Mapping

| Skill ID | Skill Name | Primary References |
|----------|-----------|-------------------|
| SK-001 | Flame Graph Generation | REF-001, REF-002, REF-003, REF-004 |
| SK-002 | JVM Profiling | REF-033 |
| SK-003 | GC Log Analysis | REF-033 (async-profiler) |
| SK-004 | Heap Dump Analysis | REF-033 (async-profiler exports) |
| SK-005 | k6 Load Testing | REF-016 (Locust as alternative) |
| SK-006 | Gatling Load Testing | REF-016 (Locust as alternative) |
| SK-007 | JMH Benchmarking | REF-045 |
| SK-008 | BenchmarkDotNet | REF-045 |
| SK-009 | SQL Query Analysis | REF-019, REF-020, REF-021, REF-022, REF-023, REF-024 |
| SK-010 | Redis/Memcached Caching | REF-025, REF-026 |
| SK-011 | Datadog APM | REF-008, REF-009 |
| SK-012 | New Relic APM | (No direct MCP found - use REF-010 OpenTelemetry) |
| SK-013 | OpenTelemetry | REF-010, REF-011, REF-015 |
| SK-014 | Pyroscope Continuous Profiling | REF-002, REF-005, REF-006 |
| SK-015 | Prometheus Metrics | REF-006, REF-027, REF-028, REF-029 |
| SK-016 | Network Performance | REF-030, REF-036 |
| SK-017 | MemLab (JavaScript) | REF-034 (Clinic.js as alternative) |
| SK-018 | Node.js Profiling | REF-034 |
| SK-019 | Go pprof | REF-001 |
| SK-020 | Python Profiling | (No direct MCP found) |

### Agents Mapping

| Agent ID | Agent Name | Primary References |
|----------|-----------|-------------------|
| AG-001 | Performance Engineer Expert | REF-031, REF-046 |
| AG-002 | CPU Profiling Expert | REF-001, REF-002, REF-033 |
| AG-003 | Memory Analysis Expert | REF-033, REF-034 |
| AG-004 | Database Performance Expert | REF-019, REF-021, REF-047 |
| AG-005 | Load Testing Expert | REF-016, REF-017, REF-018 |
| AG-006 | Caching Architecture Expert | REF-025, REF-026 |
| AG-007 | APM/Observability Expert | REF-008, REF-010, REF-013, REF-046 |
| AG-008 | Latency Optimization Expert | REF-007, REF-015 |
| AG-009 | Throughput Optimization Expert | REF-035, REF-036 |
| AG-010 | Benchmarking Expert | REF-044, REF-045 |
| AG-011 | I/O Performance Expert | REF-030, REF-036 |
| AG-012 | SLO/Performance Budget Expert | REF-006, REF-027, REF-041 |

---

## Implementation Recommendations

### High Priority Integrations
1. **Grafana MCP Server** (REF-006) - Covers Prometheus, Pyroscope, tracing
2. **Postgres MCP Pro** (REF-019) - Comprehensive database performance
3. **pprof-analyzer MCP** (REF-001) - Go profiling foundation
4. **Sentry MCP** (REF-041) - Error and performance correlation

### Medium Priority Integrations
5. **Redis MCP** (REF-025) - Caching performance
6. **Datadog MCP** (REF-008) - Enterprise APM
7. **Locust MCP** (REF-016) - Load testing
8. **Claude Telemetry** (REF-010) - OpenTelemetry integration

### Gaps Identified
- No dedicated k6 or Gatling MCP server (Locust available)
- No dedicated New Relic MCP server
- No dedicated JMH/BenchmarkDotNet MCP server
- No dedicated Python profiling MCP server
- No dedicated MemLab MCP server (consider Clinic.js for Node.js)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total References | 47 |
| MCP Servers | 32 |
| CLI Tools/Platforms | 5 |
| Claude Skills/Plugins | 6 |
| Guides/Tutorials | 4 |
| Categories Covered | 12 |
| Skills with References | 18/20 (90%) |
| Agents with References | 12/12 (100%) |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - External References Cataloged
**Next Step**: Evaluate and integrate highest-priority MCP servers
