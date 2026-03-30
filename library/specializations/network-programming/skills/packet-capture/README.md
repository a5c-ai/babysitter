# Packet Capture Skill

## Overview

The `packet-capture` skill provides expert capabilities for network packet capture and analysis using libpcap, tcpdump, tshark, and Wireshark. It enables AI-powered traffic inspection, flow analysis, and protocol dissection.

## Quick Start

### Prerequisites

1. **tcpdump** - Packet capture tool
2. **tshark** - Command-line Wireshark
3. **Root/Admin** - Privileges for live capture
4. **Optional: scapy** - Python packet manipulation

### Installation

The skill is included in the babysitter-sdk. No additional installation required.

```bash
# Install capture tools
apt-get install tcpdump wireshark-common  # Linux
brew install tcpdump wireshark            # macOS

# Install Python tools (optional)
pip install scapy
```

## Usage

### Basic Operations

```bash
# Live capture on interface
/skill packet-capture capture \
  --interface eth0 \
  --filter "port 80 or port 443" \
  --duration 60s

# Analyze pcap file
/skill packet-capture analyze \
  --file capture.pcap \
  --statistics

# Generate BPF filter
/skill packet-capture bpf-filter \
  --description "HTTP traffic to specific hosts"
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(packetCaptureTask, {
  operation: 'analyze',
  file: 'capture.pcap',
  options: {
    protocols: true,
    flows: true,
    topTalkers: 10,
    exportFormat: 'json'
  }
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Live Capture** | Capture packets with tcpdump/tshark |
| **BPF Filters** | Write efficient capture filters |
| **PCAP Analysis** | Analyze captured packet files |
| **Flow Analysis** | Extract and analyze network flows |
| **Protocol Decode** | Decode all protocol layers |
| **Dissector Gen** | Generate Wireshark dissectors |

## Examples

### Example 1: Capture HTTP Traffic

```bash
# Capture HTTP requests and responses
/skill packet-capture capture \
  --interface eth0 \
  --filter "tcp port 80" \
  --output http_traffic.pcap \
  --duration 5m
```

### Example 2: Analyze Traffic Patterns

```bash
# Analyze pcap for traffic patterns
/skill packet-capture analyze \
  --file capture.pcap \
  --report-type patterns \
  --top-n 20
```

### Example 3: Generate Custom Dissector

```bash
# Generate Wireshark dissector for custom protocol
/skill packet-capture generate-dissector \
  --protocol-name myproto \
  --port 12345 \
  --spec protocol.json \
  --output myproto.lua
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CAPTURE_INTERFACE` | Default capture interface | `eth0` |
| `CAPTURE_SNAPLEN` | Bytes to capture per packet | `65535` |
| `CAPTURE_BUFFER` | Kernel buffer size | `2MB` |

### Skill Configuration

```yaml
# .babysitter/skills/packet-capture.yaml
packet-capture:
  defaultInterface: eth0
  snapLength: 65535
  bufferSize: 2097152
  maxCaptureSize: 1073741824  # 1GB
  captureDirectory: ./captures
```

## Process Integration

### Processes Using This Skill

1. **packet-capture-analysis.js** - Packet capture workflows
2. **protocol-dissector.js** - Protocol dissection
3. **network-traffic-analyzer.js** - Traffic analysis

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTrafficTask = defineTask({
  name: 'analyze-network-traffic',
  description: 'Analyze network traffic from pcap file',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Analyze ${inputs.pcapFile}`,
      skill: {
        name: 'packet-capture',
        context: {
          operation: 'analyze',
          file: inputs.pcapFile,
          options: {
            protocols: true,
            flows: true,
            conversations: true,
            httpRequests: inputs.analyzeHttp || false
          }
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

## MCP Server Reference

### Wireshark MCP Server (sarthaksiddha)

Live packet capture and analysis.

**Features:**
- Live traffic capture
- PCAP file analysis
- Protocol statistics
- TCP stream following

**GitHub:** https://github.com/sarthaksiddha/Wireshark-mcp

### WireMCP

Real-time network traffic analysis with threat detection.

**Features:**
- `capture_packets` - Live capture to JSON
- `get_summary_stats` - Protocol hierarchy
- `check_threats` - URLhaus blacklist check
- `extract_credentials` - Credential scanning

**GitHub:** https://github.com/0xKoda/WireMCP

### mcp-wireshark (PyPI)

Python-based Wireshark integration.

**Features:**
- Capture live traffic
- Parse .pcap files
- Apply display filters
- Export to JSON

**Package:** https://pypi.org/project/mcp-wireshark/

## BPF Filter Reference

### Common Filters

| Filter | Description |
|--------|-------------|
| `host 192.168.1.1` | Traffic to/from host |
| `net 192.168.1.0/24` | Traffic to/from network |
| `port 80` | Traffic on port 80 |
| `tcp` | TCP traffic only |
| `udp` | UDP traffic only |
| `icmp` | ICMP traffic only |

### Advanced Filters

| Filter | Description |
|--------|-------------|
| `tcp[tcpflags] & tcp-syn != 0` | TCP SYN packets |
| `tcp[tcpflags] & tcp-rst != 0` | TCP RST packets |
| `ip[8] < 10` | TTL less than 10 |
| `len > 1000` | Packets larger than 1000 bytes |

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Permission denied | Run with sudo or add to wireshark group |
| No packets captured | Check interface name and filter |
| Buffer overflow | Increase buffer size or add filter |
| File too large | Use rotation with -C and -W |

### Debug Commands

```bash
# List available interfaces
tcpdump -D

# Test BPF filter syntax
tcpdump -d "tcp port 80"

# Check capture permissions
getcap /usr/sbin/tcpdump
```

## Related Skills

- **socket-programming** - Socket-level networking
- **protocol-parser** - Protocol parsing
- **tls-security** - Analyze TLS handshakes

## References

- [tcpdump Manual](https://www.tcpdump.org/manpages/tcpdump.1.html)
- [Wireshark User's Guide](https://www.wireshark.org/docs/wsug_html_chunked/)
- [BPF Filter Syntax](https://www.tcpdump.org/manpages/pcap-filter.7.html)
- [Scapy Documentation](https://scapy.readthedocs.io/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-003
**Category:** Network Analysis
**Status:** Active
