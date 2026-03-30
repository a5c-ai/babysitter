# Network Performance Skill

## Overview

The `network-performance` skill provides expert capabilities for network performance analysis and optimization. It enables AI-powered network troubleshooting including TCP tuning, TLS optimization, HTTP/2 and HTTP/3 configuration, and latency analysis.

## Quick Start

### Prerequisites

1. **tcpdump/tshark** - Packet capture and analysis
2. **ss/netstat** - Socket statistics
3. **curl** - HTTP/2 and HTTP/3 support
4. **Optional** - iperf3, mtr, traceroute, nghttp2

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

Install network tools:

```bash
# Ubuntu/Debian
apt-get install tcpdump tshark net-tools iperf3 mtr traceroute curl

# CentOS/RHEL
yum install tcpdump wireshark-cli net-tools iperf3 mtr traceroute curl

# macOS
brew install tcpdump wireshark iperf3 mtr
```

## Usage

### Basic Operations

```bash
# Analyze endpoint latency
/skill network-performance analyze-latency --url https://api.example.com/health

# TCP tuning recommendations
/skill network-performance recommend-tcp-tuning --profile high-bandwidth

# TLS handshake analysis
/skill network-performance analyze-tls --host api.example.com --port 443
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(networkTask, {
  operation: 'analyze-endpoint',
  endpoint: 'https://api.example.com',
  metrics: ['latency', 'tls', 'throughput'],
  recommendations: true
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **TCP Analysis** | Retransmissions, RTT, window sizing |
| **TCP Tuning** | Buffer sizes, congestion control, keepalive |
| **TLS Optimization** | Session resumption, OCSP, TLS 1.3 |
| **HTTP/2 Config** | Multiplexing, server push, streams |
| **HTTP/3 Config** | QUIC optimization, 0-RTT |
| **Latency Analysis** | DNS, TCP, TLS, application breakdown |

## Examples

### Example 1: Latency Breakdown

```bash
# Get detailed latency breakdown for endpoint
/skill network-performance latency-breakdown --url https://api.example.com/health
```

Output:
```
DNS Lookup:       15ms
TCP Connect:      25ms
TLS Handshake:    45ms
Server Processing: 120ms
Content Transfer:  5ms
-------------------
Total:            210ms

Recommendations:
- TLS: Consider TLS 1.3 for faster handshake (-20ms)
- DNS: Local resolver could reduce lookup (-10ms)
```

### Example 2: TCP Tuning Profile

```bash
# Generate TCP tuning for high-bandwidth, low-latency
/skill network-performance generate-tcp-config \
  --profile high-bandwidth \
  --bandwidth 10Gbps \
  --rtt 20ms \
  --output sysctl.conf
```

### Example 3: Connection Pool Analysis

```bash
# Analyze connection pool behavior
/skill network-performance analyze-connections \
  --target api.example.com:443 \
  --duration 60s
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CAPTURE_INTERFACE` | Default network interface | `eth0` |
| `PACKET_CAPTURE_COUNT` | Default packet count | `10000` |

### Skill Configuration

```yaml
# .babysitter/skills/network-performance.yaml
network-performance:
  capture:
    interface: eth0
    packetCount: 10000
    timeout: 60s
  analysis:
    includePayload: false
    anonymizeIPs: true
  tuning:
    profile: balanced  # or high-bandwidth, low-latency
```

## TCP Tuning Profiles

### Balanced (Default)

```bash
net.core.rmem_max = 8388608
net.core.wmem_max = 8388608
net.ipv4.tcp_rmem = 4096 262144 8388608
net.ipv4.tcp_wmem = 4096 262144 8388608
net.ipv4.tcp_congestion_control = cubic
```

### High Bandwidth

```bash
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 1048576 16777216
net.ipv4.tcp_wmem = 4096 1048576 16777216
net.ipv4.tcp_congestion_control = bbr
```

### Low Latency

```bash
net.ipv4.tcp_low_latency = 1
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_notsent_lowat = 16384
```

## Process Integration

### Processes Using This Skill

1. **network-io-optimization.js** - Network optimization workflows
2. **disk-io-profiling.js** - Related I/O analysis
3. **latency-analysis** - End-to-end latency optimization

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const networkAnalysisTask = defineTask({
  name: 'analyze-network-performance',
  description: 'Analyze network performance for service',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Network analysis: ${inputs.endpoint}`,
      skill: {
        name: 'network-performance',
        context: {
          operation: 'full-analysis',
          endpoint: inputs.endpoint,
          includeCapture: inputs.includeCapture,
          duration: inputs.duration
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## Latency Component Reference

| Component | Typical Range | Optimization |
|-----------|---------------|--------------|
| DNS Lookup | 5-50ms | Local resolver, caching |
| TCP Connect | 10-100ms | Connection pooling |
| TLS Handshake | 30-100ms | TLS 1.3, session resumption |
| Server Processing | Variable | Application optimization |
| Content Transfer | Variable | Compression, CDN |

## TLS Optimization Checklist

- [ ] Enable TLS 1.3
- [ ] Configure session resumption
- [ ] Enable OCSP stapling
- [ ] Use ECDSA certificates
- [ ] Keep certificate chain short
- [ ] Consider 0-RTT for repeat connections

## HTTP/2 vs HTTP/3 Decision

| Factor | HTTP/2 | HTTP/3 (QUIC) |
|--------|--------|---------------|
| Browser Support | Universal | Growing |
| Server Support | Widespread | Limited |
| Lossy Networks | Suffers | Better (no HOL blocking) |
| Connection Migration | No | Yes (IP changes) |
| Handshake | TCP + TLS | Combined (faster) |

## Troubleshooting

### Common Issues

| Issue | Diagnosis | Solution |
|-------|-----------|----------|
| High latency | `curl -w` timing | Identify component, optimize |
| Packet loss | `mtr --report` | Check network path |
| TLS slow | Check TLS version | Upgrade to TLS 1.3 |
| Connection refused | `ss -tln` | Check port/firewall |
| TIME_WAIT exhaustion | `ss -s` | Enable `tcp_tw_reuse` |

### Debug Commands

```bash
# Full endpoint analysis
/skill network-performance diagnose --url https://api.example.com/

# Connection state summary
/skill network-performance connection-stats --target api.example.com

# Generate performance report
/skill network-performance report --output network-report.md
```

## Related Skills

- **distributed-caching** - Cache to reduce network calls
- **apm-instrumentation** - Network latency in traces
- **prometheus-grafana** - Network metrics visualization

## References

- [Linux TCP Tuning Guide](https://www.kernel.org/doc/html/latest/networking/ip-sysctl.html)
- [TCP BBR Congestion Control](https://cloud.google.com/blog/products/networking/tcp-bbr-congestion-control-comes-to-gcp-your-internet-just-got-faster)
- [TLS 1.3 RFC](https://datatracker.ietf.org/doc/html/rfc8446)
- [HTTP/2 RFC](https://datatracker.ietf.org/doc/html/rfc7540)
- [HTTP/3 RFC](https://datatracker.ietf.org/doc/html/rfc9114)
- [Wireshark Documentation](https://www.wireshark.org/docs/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-016
**Category:** Network I/O
**Status:** Active
