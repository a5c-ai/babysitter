---
name: network-testing
description: Comprehensive network testing, benchmarking, and performance validation skill
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Network Testing Skill

Comprehensive skill for network testing, benchmarking, and performance validation across all network layers.

## Capabilities

- **Bandwidth Testing**: Run iperf3/netperf for throughput and bandwidth measurement
- **Load Testing**: Execute load tests with wrk, hey, k6, and Apache Bench
- **Latency Analysis**: Measure and analyze latency with ping, mtr, hping3, and traceroute
- **Protocol Conformance**: Conduct protocol conformance testing against specifications
- **Chaos Engineering**: Run chaos engineering network tests (packet loss, latency injection)
- **Test Reporting**: Generate comprehensive network test reports with metrics
- **Performance Benchmarking**: Benchmark network performance against baselines
- **Connection Testing**: Test connection establishment, teardown, and pooling

## Tools and Dependencies

- `iperf3` - Network bandwidth measurement
- `netperf` - Network performance testing
- `wrk` - HTTP benchmarking tool
- `k6` - Modern load testing tool
- `hey` - HTTP load generator
- `tc` - Traffic control for network shaping
- `mtr` - Network diagnostic tool
- `hping3` - TCP/IP packet assembler

## Target Processes

- network-testing-framework.js
- load-testing-tool.js
- protocol-fuzzer.js

## Usage Examples

### Bandwidth Testing
```bash
iperf3 -c server.example.com -t 30 -P 4
iperf3 -s -p 5201
```

### HTTP Load Testing
```bash
wrk -t12 -c400 -d30s http://localhost:8080/
k6 run --vus 100 --duration 30s script.js
hey -n 10000 -c 100 http://localhost:8080/
```

### Latency Analysis
```bash
mtr --report --report-cycles 100 example.com
hping3 -S -p 80 -c 100 example.com
```

### Network Chaos
```bash
tc qdisc add dev eth0 root netem delay 100ms 10ms
tc qdisc add dev eth0 root netem loss 5%
```

## Quality Gates

- Bandwidth meets requirements
- Latency within SLA thresholds
- Error rates below threshold
- Connection handling validated
- Protocol conformance verified
