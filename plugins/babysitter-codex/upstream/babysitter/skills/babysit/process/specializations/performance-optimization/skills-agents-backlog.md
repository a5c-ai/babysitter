# Performance Optimization and Profiling - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Performance Optimization processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized profiling, benchmarking, and observability tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 30 implemented processes in this specialization currently use the `general-purpose` agent for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide for profiling, benchmarking, and performance analysis.

### Goals
- Provide deep expertise in CPU, memory, and I/O profiling techniques
- Enable automated performance analysis with real profiler integration
- Reduce false positives in performance bottleneck identification
- Improve accuracy of optimization recommendations with tool-specific knowledge
- Support multi-platform profiling (JVM, .NET, Node.js, Go, Python)

---

## Skills Backlog

### SK-001: Flame Graph Generation Skill
**Slug**: `flame-graph-generator`
**Category**: CPU Profiling

**Description**: Expert skill for generating and interpreting flame graphs from profiling data.

**Capabilities**:
- Generate flame graphs using FlameGraph scripts
- Convert perf/dtrace/async-profiler data to flame graph format
- Create differential flame graphs for before/after comparison
- Generate off-CPU flame graphs for I/O analysis
- Interpret stack traces and identify hot paths
- Support for collapsed stack format manipulation
- Interactive SVG generation with zoom/search

**Process Integration**:
- cpu-profiling-investigation.js
- continuous-profiling-setup.js
- performance-baseline-assessment.js

**Dependencies**: FlameGraph scripts, perl/python runtime

---

### SK-002: JVM Profiling Skill
**Slug**: `jvm-profiling`
**Category**: Runtime Profiling

**Description**: Deep JVM profiling expertise including async-profiler, JFR, and GC analysis.

**Capabilities**:
- Execute and analyze async-profiler sessions
- Configure and analyze Java Flight Recorder (JFR) recordings
- Interpret JFR event streams and method samples
- Generate JFR reports with jfr command
- Analyze safepoint and lock contention data
- Profile native code alongside Java code
- Support for GraalVM native image profiling

**Process Integration**:
- cpu-profiling-investigation.js
- memory-profiling-analysis.js
- garbage-collection-tuning.js
- continuous-profiling-setup.js

**Dependencies**: async-profiler, JDK (JFR tools)

---

### SK-003: GC Log Analysis Skill
**Slug**: `gc-log-analysis`
**Category**: Memory Profiling

**Description**: Garbage collection log parsing, analysis, and tuning recommendations.

**Capabilities**:
- Parse GC logs (G1GC, ZGC, Shenandoah, CMS, Parallel)
- Analyze GC pause distributions (p50, p95, p99)
- Identify GC causes and triggers
- Calculate throughput vs latency tradeoffs
- Generate GC tuning recommendations
- Support for GCEasy and GCViewer output
- Detect memory leak patterns from GC behavior

**Process Integration**:
- garbage-collection-tuning.js
- memory-leak-detection.js
- memory-profiling-analysis.js

**Dependencies**: GC log parser libraries

---

### SK-004: Heap Dump Analysis Skill
**Slug**: `heap-dump-analysis`
**Category**: Memory Profiling

**Description**: Expert analysis of heap dumps for memory leak detection and optimization.

**Capabilities**:
- Analyze heap dumps with Eclipse MAT patterns
- Build and analyze dominator trees
- Identify object retention paths
- Calculate retained heap sizes
- Detect common leak patterns (collections, listeners, caches)
- Generate OQL queries for deep analysis
- Compare heap snapshots for growth analysis

**Process Integration**:
- memory-leak-detection.js
- memory-profiling-analysis.js
- memory-allocation-optimization.js

**Dependencies**: Eclipse MAT CLI, jmap

---

### SK-005: Load Testing Skill (k6)
**Slug**: `k6-load-testing`
**Category**: Load Testing

**Description**: Comprehensive k6 load testing script development and execution.

**Capabilities**:
- Write k6 test scripts in JavaScript
- Configure load patterns (ramp-up, steady, spike)
- Define checks and thresholds
- Configure virtual user scenarios
- Analyze k6 output metrics
- Generate HTML reports from k6 output
- Integrate with k6 Cloud and Grafana

**Process Integration**:
- load-testing-framework-setup.js
- load-test-execution.js
- stress-testing-analysis.js
- endurance-testing.js

**Dependencies**: k6 CLI

---

### SK-006: Load Testing Skill (Gatling)
**Slug**: `gatling-load-testing`
**Category**: Load Testing

**Description**: Gatling simulation development and performance analysis.

**Capabilities**:
- Write Gatling simulations in Scala DSL
- Configure injection profiles and feeders
- Define assertions and response time percentiles
- Analyze Gatling HTML reports
- Configure session handling and correlation
- Generate and interpret simulation logs
- Support for Gatling Enterprise integration

**Process Integration**:
- load-testing-framework-setup.js
- load-test-execution.js
- stress-testing-analysis.js

**Dependencies**: Gatling CLI, Java/Scala runtime

---

### SK-007: JMH Benchmarking Skill
**Slug**: `jmh-benchmarking`
**Category**: Microbenchmarking

**Description**: Java Microbenchmark Harness (JMH) development and analysis.

**Capabilities**:
- Write JMH benchmarks with proper annotations
- Configure warmup and measurement iterations
- Handle JMH state management patterns
- Analyze JMH output with statistical significance
- Avoid common benchmarking pitfalls
- Configure forking and thread settings
- Generate JMH benchmark reports

**Process Integration**:
- microbenchmark-suite-development.js
- algorithm-optimization.js
- performance-regression-detection.js

**Dependencies**: JMH, Maven/Gradle

---

### SK-008: BenchmarkDotNet Skill
**Slug**: `benchmarkdotnet`
**Category**: Microbenchmarking

**Description**: .NET benchmarking expertise with BenchmarkDotNet.

**Capabilities**:
- Write BenchmarkDotNet benchmarks
- Configure diagnostic analyzers
- Analyze memory allocations
- Compare multiple implementations
- Configure baseline and categories
- Generate Markdown/HTML reports
- Interpret statistical results

**Process Integration**:
- microbenchmark-suite-development.js
- algorithm-optimization.js
- performance-regression-detection.js

**Dependencies**: BenchmarkDotNet NuGet, .NET SDK

---

### SK-009: Database Query Analysis Skill
**Slug**: `sql-query-analysis`
**Category**: Database Optimization

**Description**: SQL query performance analysis and optimization for multiple databases.

**Capabilities**:
- Analyze PostgreSQL EXPLAIN ANALYZE output
- Interpret MySQL/MariaDB execution plans
- Analyze Oracle execution plans and hints
- Identify missing and redundant indexes
- Detect full table scans and nested loops
- Recommend query rewrites and index strategies
- Calculate query cost estimations

**Process Integration**:
- query-performance-analysis.js
- index-strategy-optimization.js
- n-plus-one-query-detection.js
- database-configuration-tuning.js

**Dependencies**: Database CLI tools (psql, mysql)

---

### SK-010: Redis/Memcached Caching Skill
**Slug**: `distributed-caching`
**Category**: Caching

**Description**: Distributed cache design, implementation, and optimization.

**Capabilities**:
- Design Redis data structures and commands
- Configure Redis cluster and sentinel
- Implement cache-aside, write-through patterns
- Configure eviction policies (LRU, LFU, TTL)
- Monitor cache hit rates and memory usage
- Debug cache invalidation issues
- Optimize Redis memory usage

**Process Integration**:
- caching-strategy-design.js
- distributed-cache-implementation (backlog)
- application-level-cache-optimization (backlog)

**Dependencies**: redis-cli, memcached utilities

---

### SK-011: APM Integration Skill (Datadog)
**Slug**: `datadog-apm`
**Category**: APM

**Description**: Datadog APM instrumentation and analysis expertise.

**Capabilities**:
- Configure Datadog tracing libraries
- Write custom instrumentation and spans
- Create Datadog dashboards and monitors
- Analyze Datadog APM traces and metrics
- Configure sampling and retention
- Set up Datadog log correlation
- Create APM alerting rules

**Process Integration**:
- apm-instrumentation.js
- distributed-tracing-implementation.js
- real-user-monitoring-setup.js

**Dependencies**: Datadog Agent, dd-trace libraries

---

### SK-012: APM Integration Skill (New Relic)
**Slug**: `newrelic-apm`
**Category**: APM

**Description**: New Relic APM integration and performance analysis.

**Capabilities**:
- Configure New Relic agents
- Create custom New Relic instrumentation
- Build New Relic dashboards (NRQL)
- Analyze transaction traces
- Configure alert policies and conditions
- Set up distributed tracing
- Analyze error analytics

**Process Integration**:
- apm-instrumentation.js
- distributed-tracing-implementation.js
- real-user-monitoring-setup.js

**Dependencies**: New Relic agents and CLI

---

### SK-013: OpenTelemetry Skill
**Slug**: `opentelemetry`
**Category**: Observability

**Description**: OpenTelemetry instrumentation and trace analysis expertise.

**Capabilities**:
- Configure OTel SDKs for traces, metrics, logs
- Write custom span instrumentation
- Configure OTel Collector pipelines
- Analyze trace data with OTel format
- Set up context propagation (W3C, B3)
- Configure sampling strategies
- Export to multiple backends (Jaeger, Zipkin, Tempo)

**Process Integration**:
- distributed-tracing-implementation.js
- apm-instrumentation.js
- real-user-monitoring-setup.js

**Dependencies**: OTel SDK, OTel Collector

---

### SK-014: Continuous Profiling Skill (Pyroscope)
**Slug**: `pyroscope-profiling`
**Category**: Continuous Profiling

**Description**: Pyroscope continuous profiling setup and analysis.

**Capabilities**:
- Deploy Pyroscope server and agents
- Configure profiling for multiple languages
- Analyze continuous flame graphs
- Set up profile comparisons (diff mode)
- Configure labeling and tagging
- Integrate with Grafana
- Set profiling alerts

**Process Integration**:
- continuous-profiling-setup.js
- cpu-profiling-investigation.js
- memory-profiling-analysis.js

**Dependencies**: Pyroscope server and agents

---

### SK-015: Prometheus Metrics Skill
**Slug**: `prometheus-metrics`
**Category**: Monitoring

**Description**: Prometheus metrics collection and PromQL query expertise.

**Capabilities**:
- Write and optimize PromQL queries
- Design metric naming conventions
- Configure recording and alerting rules
- Analyze metric cardinality
- Create Grafana dashboards from PromQL
- Debug scrape configurations
- Implement histogram and summary metrics

**Process Integration**:
- performance-slo-definition.js
- performance-baseline-assessment.js
- performance-regression-detection.js
- capacity-planning-analysis.js

**Dependencies**: Prometheus, promtool

---

### SK-016: Network Performance Skill
**Slug**: `network-performance`
**Category**: Network I/O

**Description**: Network performance analysis and optimization.

**Capabilities**:
- Analyze packet captures with tcpdump/Wireshark
- Identify network latency bottlenecks
- Configure TCP tuning parameters
- Analyze connection pooling behavior
- Debug TLS handshake performance
- Optimize HTTP/2 and HTTP/3 settings
- Implement network compression strategies

**Process Integration**:
- network-io-optimization.js
- disk-io-profiling.js

**Dependencies**: tcpdump, netstat, ss

---

### SK-017: MemLab Skill
**Slug**: `memlab-analysis`
**Category**: Memory Profiling

**Description**: Facebook MemLab for JavaScript memory leak detection.

**Capabilities**:
- Configure MemLab scenarios
- Execute memory leak detection runs
- Analyze MemLab heap snapshots
- Identify detached DOM elements
- Find event listener leaks
- Generate MemLab reports
- Integrate with CI pipelines

**Process Integration**:
- memory-leak-detection.js
- memory-profiling-analysis.js

**Dependencies**: MemLab CLI, Node.js

---

### SK-018: Node.js Profiling Skill
**Slug**: `nodejs-profiling`
**Category**: Runtime Profiling

**Description**: Node.js-specific profiling and optimization.

**Capabilities**:
- Use V8 CPU profiler
- Analyze Node.js heap snapshots
- Configure clinic.js tools (Doctor, Flame, Bubbleprof)
- Debug event loop blocking
- Analyze async hooks performance
- Profile native addons
- Optimize V8 JIT compilation

**Process Integration**:
- cpu-profiling-investigation.js
- memory-profiling-analysis.js
- memory-leak-detection.js

**Dependencies**: Node.js, clinic.js

---

### SK-019: Go Profiling Skill (pprof)
**Slug**: `go-pprof`
**Category**: Runtime Profiling

**Description**: Go runtime profiling with pprof.

**Capabilities**:
- Configure and collect pprof profiles
- Analyze CPU, memory, goroutine profiles
- Generate and interpret flame graphs from pprof
- Debug goroutine leaks
- Analyze mutex and block profiles
- Use go tool trace for latency analysis
- Integrate with continuous profiling

**Process Integration**:
- cpu-profiling-investigation.js
- memory-profiling-analysis.js
- concurrency-optimization.js

**Dependencies**: Go runtime, pprof

---

### SK-020: Python Profiling Skill
**Slug**: `python-profiling`
**Category**: Runtime Profiling

**Description**: Python profiling with cProfile, py-spy, and memory_profiler.

**Capabilities**:
- Run cProfile and analyze with pstats
- Use py-spy for production profiling
- Profile memory with memory_profiler
- Analyze Python GIL contention
- Profile async Python code
- Generate Python flame graphs
- Debug import time issues

**Process Integration**:
- cpu-profiling-investigation.js
- memory-profiling-analysis.js
- algorithm-optimization.js

**Dependencies**: py-spy, memory_profiler, cProfile

---

---

## Agents Backlog

### AG-001: Performance Engineer Expert Agent
**Slug**: `performance-engineer-expert`
**Category**: Performance Analysis

**Description**: Senior performance engineer with comprehensive profiling and optimization expertise.

**Expertise Areas**:
- System performance fundamentals (USE method, RED method)
- Brendan Gregg's performance analysis methodology
- Multi-tier application performance
- Capacity planning and forecasting
- Performance budgets and SLOs
- Root cause analysis for performance issues
- Performance testing best practices

**Persona**:
- Role: Senior Performance Engineer
- Experience: 10+ years performance engineering
- Background: System internals, profiling tools, optimization

**Process Integration**:
- performance-baseline-assessment.js (all phases)
- performance-slo-definition.js (all phases)
- capacity-planning-analysis.js (all phases)
- performance-tuning-recommendations.js (all phases)

---

### AG-002: CPU Profiling Expert Agent
**Slug**: `cpu-profiling-expert`
**Category**: CPU Analysis

**Description**: Specialist in CPU profiling, flame graph interpretation, and CPU optimization.

**Expertise Areas**:
- CPU microarchitecture and cache behavior
- Sampling vs instrumentation profiling
- Flame graph interpretation and analysis
- Hot path optimization strategies
- CPU-bound workload optimization
- Compiler optimization understanding
- Branch prediction and instruction-level optimization

**Persona**:
- Role: CPU Performance Specialist
- Experience: 8+ years low-level optimization
- Background: Systems programming, compiler optimization

**Process Integration**:
- cpu-profiling-investigation.js (all phases)
- cpu-optimization-implementation.js (all phases)
- algorithm-optimization.js (optimization strategies)
- continuous-profiling-setup.js (CPU profiling)

---

### AG-003: Memory Analysis Expert Agent
**Slug**: `memory-analysis-expert`
**Category**: Memory Analysis

**Description**: Expert in memory profiling, leak detection, and memory optimization.

**Expertise Areas**:
- Heap analysis and object retention
- Memory leak detection patterns
- Garbage collection algorithms (G1, ZGC, Shenandoah)
- Memory allocation optimization
- Off-heap memory management
- Memory-mapped I/O
- Cache-conscious data structures

**Persona**:
- Role: Memory Performance Specialist
- Experience: 8+ years memory optimization
- Background: JVM internals, native memory management

**Process Integration**:
- memory-profiling-analysis.js (all phases)
- memory-leak-detection.js (all phases)
- garbage-collection-tuning.js (all phases)
- memory-allocation-optimization.js (all phases)

---

### AG-004: Database Performance Expert Agent
**Slug**: `database-performance-expert`
**Category**: Database Optimization

**Description**: Database query optimization and performance tuning specialist.

**Expertise Areas**:
- Query execution plan analysis
- Index design and optimization
- Query rewriting strategies
- Database configuration tuning
- Connection pool optimization
- N+1 query detection and resolution
- Database-specific optimization (PostgreSQL, MySQL, Oracle)

**Persona**:
- Role: Database Performance Architect
- Experience: 10+ years database optimization
- Background: DBA, query optimization, database internals

**Process Integration**:
- query-performance-analysis.js (all phases)
- index-strategy-optimization.js (all phases)
- database-configuration-tuning.js (all phases)
- n-plus-one-query-detection.js (all phases)

---

### AG-005: Load Testing Expert Agent
**Slug**: `load-testing-expert`
**Category**: Load Testing

**Description**: Expert in load testing strategy, execution, and analysis.

**Expertise Areas**:
- Load test scenario design
- Workload modeling and simulation
- Performance threshold definition
- Stress and soak testing strategies
- Load testing tool selection (k6, Gatling, Locust)
- Test data management
- Load test result interpretation

**Persona**:
- Role: Performance Test Architect
- Experience: 8+ years performance testing
- Background: QA engineering, performance testing

**Process Integration**:
- load-testing-framework-setup.js (all phases)
- load-test-execution.js (all phases)
- stress-testing-analysis.js (all phases)
- endurance-testing.js (all phases)

---

### AG-006: Caching Architecture Expert Agent
**Slug**: `caching-architect`
**Category**: Caching

**Description**: Expert in multi-tier caching architecture and optimization.

**Expertise Areas**:
- Cache layer design (L1, L2, distributed)
- Cache invalidation strategies
- Cache consistency patterns
- Redis/Memcached optimization
- CDN caching strategies
- Cache hit rate optimization
- Cache warming and preloading

**Persona**:
- Role: Caching Infrastructure Architect
- Experience: 8+ years distributed systems
- Background: High-scale web systems, caching patterns

**Process Integration**:
- caching-strategy-design.js (all phases)
- distributed-cache-implementation (backlog)
- cdn-edge-caching-setup (backlog)
- application-level-cache-optimization (backlog)

---

### AG-007: APM and Observability Expert Agent
**Slug**: `apm-observability-expert`
**Category**: Observability

**Description**: Application Performance Monitoring and distributed tracing specialist.

**Expertise Areas**:
- APM tool selection and deployment
- Distributed tracing implementation
- Span instrumentation design
- Trace sampling strategies
- Service maps and dependency analysis
- Performance anomaly detection
- APM integration with alerting

**Persona**:
- Role: Observability Architect
- Experience: 7+ years observability engineering
- Background: SRE, monitoring, distributed systems

**Process Integration**:
- apm-instrumentation.js (all phases)
- distributed-tracing-implementation.js (all phases)
- real-user-monitoring-setup.js (all phases)
- continuous-profiling-setup.js (observability integration)

---

### AG-008: Latency Optimization Expert Agent
**Slug**: `latency-optimization-expert`
**Category**: Latency

**Description**: Expert in end-to-end latency analysis and tail latency optimization.

**Expertise Areas**:
- End-to-end latency breakdown
- Tail latency (p99, p99.9) optimization
- Critical path analysis
- Async processing patterns
- Connection pooling optimization
- Timeout and retry strategies
- Hedged request patterns

**Persona**:
- Role: Latency Engineering Specialist
- Experience: 8+ years high-performance systems
- Background: Low-latency trading systems, real-time systems

**Process Integration**:
- latency-analysis-reduction (backlog)
- p99-latency-optimization (backlog)
- network-io-optimization.js

---

### AG-009: Throughput Optimization Expert Agent
**Slug**: `throughput-optimization-expert`
**Category**: Throughput

**Description**: Expert in system throughput maximization and scalability.

**Expertise Areas**:
- Throughput bottleneck analysis
- Concurrency optimization
- Lock-free data structures
- Batching and pipelining patterns
- Thread pool tuning
- Horizontal scaling strategies
- Resource utilization optimization

**Persona**:
- Role: Throughput Engineering Specialist
- Experience: 8+ years high-throughput systems
- Background: Distributed systems, parallel computing

**Process Integration**:
- throughput-analysis-improvement (backlog)
- concurrency-optimization.js
- algorithm-optimization.js

---

### AG-010: Benchmarking Expert Agent
**Slug**: `benchmarking-expert`
**Category**: Benchmarking

**Description**: Expert in microbenchmarking, statistical analysis, and regression detection.

**Expertise Areas**:
- Benchmark design and methodology
- Statistical significance in performance
- JMH and BenchmarkDotNet expertise
- Benchmark harness development
- CI/CD benchmark integration
- Regression detection strategies
- A/B performance testing

**Persona**:
- Role: Benchmark Engineering Specialist
- Experience: 6+ years performance measurement
- Background: Scientific computing, statistics

**Process Integration**:
- microbenchmark-suite-development.js (all phases)
- performance-regression-detection.js (all phases)
- algorithm-optimization.js (benchmarking phases)

---

### AG-011: I/O Performance Expert Agent
**Slug**: `io-performance-expert`
**Category**: I/O Optimization

**Description**: Expert in disk and network I/O optimization.

**Expertise Areas**:
- Disk I/O patterns (sequential, random)
- File system optimization
- Network I/O and TCP tuning
- Async I/O and io_uring
- Buffer and batch optimization
- Connection pooling
- Protocol optimization (HTTP/2, gRPC)

**Persona**:
- Role: I/O Performance Specialist
- Experience: 7+ years systems engineering
- Background: Operating systems, network programming

**Process Integration**:
- disk-io-profiling.js (all phases)
- network-io-optimization.js (all phases)
- file-system-optimization.js (all phases)

---

### AG-012: SLO/Performance Budget Expert Agent
**Slug**: `slo-budget-expert`
**Category**: Performance Management

**Description**: Expert in defining and managing performance SLOs and budgets.

**Expertise Areas**:
- SLO/SLI definition for performance
- Error budget management
- Performance budget allocation
- Core Web Vitals optimization
- Performance regression policies
- Performance alerting strategies
- Performance reporting

**Persona**:
- Role: Performance SRE Lead
- Experience: 7+ years SRE/performance
- Background: SRE, performance management

**Process Integration**:
- performance-slo-definition.js (all phases)
- performance-baseline-assessment.js (budgeting)
- performance-regression-detection.js (SLO enforcement)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| performance-baseline-assessment.js | SK-015, SK-013 | AG-001, AG-012 |
| performance-slo-definition.js | SK-015 | AG-001, AG-012 |
| cpu-profiling-investigation.js | SK-001, SK-002, SK-019, SK-020 | AG-002 |
| cpu-optimization-implementation.js | SK-001, SK-002 | AG-002, AG-009 |
| algorithm-optimization.js | SK-007, SK-008 | AG-002, AG-010 |
| memory-profiling-analysis.js | SK-003, SK-004, SK-017, SK-018 | AG-003 |
| memory-leak-detection.js | SK-004, SK-017 | AG-003 |
| garbage-collection-tuning.js | SK-003, SK-002 | AG-003 |
| memory-allocation-optimization.js | SK-004, SK-002 | AG-003 |
| disk-io-profiling.js | SK-016 | AG-011 |
| network-io-optimization.js | SK-016 | AG-011, AG-008 |
| file-system-optimization.js | SK-016 | AG-011 |
| query-performance-analysis.js | SK-009 | AG-004 |
| index-strategy-optimization.js | SK-009 | AG-004 |
| database-configuration-tuning.js | SK-009 | AG-004 |
| n-plus-one-query-detection.js | SK-009 | AG-004 |
| caching-strategy-design.js | SK-010 | AG-006 |
| load-testing-framework-setup.js | SK-005, SK-006 | AG-005 |
| load-test-execution.js | SK-005, SK-006 | AG-005 |
| stress-testing-analysis.js | SK-005, SK-006 | AG-005 |
| microbenchmark-suite-development.js | SK-007, SK-008 | AG-010 |
| performance-regression-detection.js | SK-007, SK-008, SK-015 | AG-010, AG-012 |
| apm-instrumentation.js | SK-011, SK-012, SK-013 | AG-007 |
| distributed-tracing-implementation.js | SK-013, SK-011, SK-012 | AG-007 |
| real-user-monitoring-setup.js | SK-011, SK-012 | AG-007 |
| continuous-profiling-setup.js | SK-014, SK-001 | AG-002, AG-007 |
| capacity-planning-analysis.js | SK-015 | AG-001 |
| performance-tuning-recommendations.js | SK-001, SK-003, SK-009 | AG-001 |
| endurance-testing.js | SK-005, SK-006 | AG-005, AG-003 |
| concurrency-optimization.js | SK-019, SK-002 | AG-009 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-005 | k6 Load Testing | QA Testing, DevOps/SRE |
| SK-006 | Gatling Load Testing | QA Testing, DevOps/SRE |
| SK-009 | SQL Query Analysis | Data Engineering, Backend Development |
| SK-010 | Redis/Memcached | Backend Development, DevOps/SRE |
| SK-011 | Datadog APM | DevOps/SRE, Backend Development |
| SK-012 | New Relic APM | DevOps/SRE, Backend Development |
| SK-013 | OpenTelemetry | DevOps/SRE, Backend Development, Microservices |
| SK-015 | Prometheus Metrics | DevOps/SRE, Software Architecture |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-004 | Database Performance Expert | Data Engineering, Backend Development |
| AG-005 | Load Testing Expert | QA Testing, DevOps/SRE |
| AG-007 | APM/Observability Expert | DevOps/SRE, Software Architecture |
| AG-012 | SLO/Performance Budget Expert | DevOps/SRE, SRE |

---

## Implementation Priority

### Phase 1: Critical Skills (High Impact - Profiling Foundation)
1. **SK-001**: Flame Graph Generation - Core visualization for CPU profiling
2. **SK-002**: JVM Profiling - Most common enterprise runtime
3. **SK-003**: GC Log Analysis - Critical for memory optimization
4. **SK-005**: k6 Load Testing - Modern load testing standard

### Phase 2: Critical Agents (High Impact - Expert Knowledge)
1. **AG-001**: Performance Engineer Expert - Cross-cutting expertise
2. **AG-002**: CPU Profiling Expert - Core profiling knowledge
3. **AG-003**: Memory Analysis Expert - Memory optimization expertise
4. **AG-004**: Database Performance Expert - Query optimization

### Phase 3: Extended Profiling Tools
1. **SK-004**: Heap Dump Analysis
2. **SK-009**: SQL Query Analysis
3. **SK-013**: OpenTelemetry
4. **SK-014**: Pyroscope Continuous Profiling
5. **AG-005**: Load Testing Expert

### Phase 4: APM and Observability
1. **SK-011**: Datadog APM
2. **SK-012**: New Relic APM
3. **SK-015**: Prometheus Metrics
4. **AG-007**: APM/Observability Expert
5. **AG-012**: SLO/Budget Expert

### Phase 5: Specialized Runtime Support
1. **SK-017**: MemLab (JavaScript)
2. **SK-018**: Node.js Profiling
3. **SK-019**: Go pprof
4. **SK-020**: Python Profiling
5. **SK-007**: JMH Benchmarking
6. **SK-008**: BenchmarkDotNet

### Phase 6: Advanced Optimization
1. **SK-006**: Gatling Load Testing
2. **SK-010**: Distributed Caching
3. **SK-016**: Network Performance
4. **AG-006**: Caching Architecture Expert
5. **AG-008**: Latency Optimization Expert
6. **AG-009**: Throughput Optimization Expert
7. **AG-010**: Benchmarking Expert
8. **AG-011**: I/O Performance Expert

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 12 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 30 |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 4 - Skills and Agents Identified
**Next Step**: Phase 5 - Implement specialized skills and agents
