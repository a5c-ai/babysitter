---
name: packet-capture
description: Expert skill for packet capture and analysis using libpcap/Wireshark. Execute tcpdump/tshark commands, write BPF filter expressions, analyze pcap files, decode protocol layers, calculate statistics, and generate Wireshark dissectors.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: network-analysis
  backlog-id: SK-003
---

# packet-capture

You are **packet-capture** - a specialized skill for network packet capture and analysis, providing expert capabilities with libpcap, tcpdump, tshark, and Wireshark for deep network traffic inspection.

## Overview

This skill enables AI-powered packet capture and analysis including:
- Executing tcpdump/tshark commands and interpreting output
- Writing and validating BPF filter expressions
- Analyzing pcap/pcapng files
- Decoding protocol layers (Ethernet, IP, TCP, UDP, application)
- Calculating packet statistics and flow analysis
- Generating Wireshark dissectors
- Creating custom capture filters

## Prerequisites

- `tcpdump` or `tshark` installed
- Root/admin privileges for live capture
- Optional: Wireshark for GUI analysis
- Optional: Python with scapy for programmatic analysis

## Capabilities

### 1. Live Packet Capture

Capture network traffic with tcpdump and tshark:

```bash
# Basic capture on interface
tcpdump -i eth0 -nn

# Capture with timestamp precision
tcpdump -i eth0 -nn -tttt

# Capture to file
tcpdump -i eth0 -w capture.pcap

# Capture with rotation (100MB files, keep 10)
tcpdump -i eth0 -w capture_%Y%m%d_%H%M%S.pcap -C 100 -W 10

# Capture specific traffic
tcpdump -i eth0 -nn 'port 80 or port 443'

# tshark capture with display filter
tshark -i eth0 -Y 'http.request.method == "GET"'

# tshark capture specific fields
tshark -i eth0 -T fields \
  -e frame.time \
  -e ip.src \
  -e ip.dst \
  -e tcp.port \
  -e http.host
```

### 2. BPF Filter Expressions

Write efficient Berkeley Packet Filter expressions:

```bash
# Host filters
tcpdump host 192.168.1.100
tcpdump src host 192.168.1.100
tcpdump dst host 192.168.1.100

# Network filters
tcpdump net 192.168.1.0/24
tcpdump src net 10.0.0.0/8

# Port filters
tcpdump port 80
tcpdump src port 443
tcpdump portrange 8000-8100

# Protocol filters
tcpdump tcp
tcpdump udp
tcpdump icmp
tcpdump 'ip proto 47'  # GRE

# Combining filters
tcpdump 'host 192.168.1.100 and port 80'
tcpdump 'src host 192.168.1.100 or dst host 192.168.1.100'
tcpdump 'tcp and (port 80 or port 443)'
tcpdump 'not port 22'  # Exclude SSH

# TCP flag filters
tcpdump 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0'
tcpdump 'tcp[tcpflags] & tcp-syn != 0'  # SYN packets
tcpdump 'tcp[tcpflags] & tcp-rst != 0'  # RST packets

# Payload filters
tcpdump 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x47455420'  # HTTP GET
tcpdump 'tcp[((tcp[12:1] & 0xf0) >> 2):4] = 0x504f5354'  # HTTP POST

# VLAN filters
tcpdump 'vlan 100'
tcpdump 'vlan and host 192.168.1.100'
```

### 3. PCAP File Analysis

Analyze captured packet files:

```bash
# Read pcap file
tcpdump -r capture.pcap -nn

# Count packets
tcpdump -r capture.pcap | wc -l

# Extract specific fields with tshark
tshark -r capture.pcap -T fields \
  -e frame.number \
  -e frame.time_relative \
  -e ip.src \
  -e ip.dst \
  -e tcp.stream \
  -e http.request.uri

# Protocol hierarchy statistics
tshark -r capture.pcap -q -z io,phs

# Conversation statistics
tshark -r capture.pcap -q -z conv,tcp
tshark -r capture.pcap -q -z conv,ip

# Endpoint statistics
tshark -r capture.pcap -q -z endpoints,tcp

# HTTP statistics
tshark -r capture.pcap -q -z http,tree
tshark -r capture.pcap -q -z http_req,tree

# Follow TCP stream
tshark -r capture.pcap -q -z follow,tcp,ascii,0

# Export objects (HTTP, SMB, etc.)
tshark -r capture.pcap --export-objects http,./http_exports/

# Time-based statistics
tshark -r capture.pcap -q -z io,stat,1
```

### 4. Protocol Layer Decoding

Decode and analyze protocol layers:

```python
from scapy.all import *

def analyze_packet(packet):
    """Analyze packet layers."""
    analysis = {}

    # Ethernet layer
    if Ether in packet:
        eth = packet[Ether]
        analysis['ethernet'] = {
            'src': eth.src,
            'dst': eth.dst,
            'type': hex(eth.type)
        }

    # IP layer
    if IP in packet:
        ip = packet[IP]
        analysis['ip'] = {
            'version': ip.version,
            'ihl': ip.ihl,
            'tos': ip.tos,
            'len': ip.len,
            'id': ip.id,
            'flags': str(ip.flags),
            'frag': ip.frag,
            'ttl': ip.ttl,
            'proto': ip.proto,
            'src': ip.src,
            'dst': ip.dst
        }

    # TCP layer
    if TCP in packet:
        tcp = packet[TCP]
        analysis['tcp'] = {
            'sport': tcp.sport,
            'dport': tcp.dport,
            'seq': tcp.seq,
            'ack': tcp.ack,
            'flags': str(tcp.flags),
            'window': tcp.window,
            'options': [(name, val) for name, val in tcp.options]
        }

    # UDP layer
    if UDP in packet:
        udp = packet[UDP]
        analysis['udp'] = {
            'sport': udp.sport,
            'dport': udp.dport,
            'len': udp.len
        }

    # HTTP layer (raw)
    if Raw in packet:
        payload = packet[Raw].load
        if payload.startswith(b'GET ') or payload.startswith(b'POST ') or \
           payload.startswith(b'HTTP/'):
            analysis['http'] = {
                'payload': payload[:500].decode('utf-8', errors='replace')
            }

    return analysis

def analyze_pcap(filename):
    """Analyze all packets in a pcap file."""
    packets = rdpcap(filename)
    results = []

    for i, pkt in enumerate(packets):
        result = {
            'number': i + 1,
            'time': float(pkt.time),
            'length': len(pkt),
            'layers': analyze_packet(pkt)
        }
        results.append(result)

    return results
```

### 5. Flow Analysis

Analyze network flows and connections:

```python
from collections import defaultdict
from scapy.all import *

def extract_flows(pcap_file):
    """Extract TCP/UDP flows from pcap file."""
    packets = rdpcap(pcap_file)
    flows = defaultdict(lambda: {
        'packets': [],
        'bytes': 0,
        'start_time': None,
        'end_time': None
    })

    for pkt in packets:
        if IP not in pkt:
            continue

        src_ip = pkt[IP].src
        dst_ip = pkt[IP].dst

        if TCP in pkt:
            src_port = pkt[TCP].sport
            dst_port = pkt[TCP].dport
            proto = 'tcp'
        elif UDP in pkt:
            src_port = pkt[UDP].sport
            dst_port = pkt[UDP].dport
            proto = 'udp'
        else:
            continue

        # Create bidirectional flow key
        if (src_ip, src_port) < (dst_ip, dst_port):
            flow_key = (src_ip, src_port, dst_ip, dst_port, proto)
        else:
            flow_key = (dst_ip, dst_port, src_ip, src_port, proto)

        flow = flows[flow_key]
        flow['packets'].append(pkt)
        flow['bytes'] += len(pkt)

        pkt_time = float(pkt.time)
        if flow['start_time'] is None or pkt_time < flow['start_time']:
            flow['start_time'] = pkt_time
        if flow['end_time'] is None or pkt_time > flow['end_time']:
            flow['end_time'] = pkt_time

    return flows

def flow_statistics(flows):
    """Calculate statistics for flows."""
    stats = []
    for key, flow in flows.items():
        src_ip, src_port, dst_ip, dst_port, proto = key
        duration = flow['end_time'] - flow['start_time'] if flow['end_time'] != flow['start_time'] else 0.001

        stats.append({
            'src': f"{src_ip}:{src_port}",
            'dst': f"{dst_ip}:{dst_port}",
            'protocol': proto,
            'packets': len(flow['packets']),
            'bytes': flow['bytes'],
            'duration': duration,
            'bps': flow['bytes'] * 8 / duration,
            'pps': len(flow['packets']) / duration
        })

    return sorted(stats, key=lambda x: x['bytes'], reverse=True)
```

### 6. Wireshark Dissector Generation

Generate custom Wireshark dissectors:

```lua
-- Custom Protocol Dissector for Lua
-- Save as myprotocol.lua in Wireshark plugins directory

local myproto = Proto("myproto", "My Custom Protocol")

-- Define fields
local f_magic = ProtoField.uint8("myproto.magic", "Magic", base.HEX)
local f_version = ProtoField.uint8("myproto.version", "Version", base.DEC)
local f_type = ProtoField.uint8("myproto.type", "Message Type", base.DEC)
local f_flags = ProtoField.uint8("myproto.flags", "Flags", base.HEX)
local f_length = ProtoField.uint32("myproto.length", "Payload Length", base.DEC)
local f_payload = ProtoField.bytes("myproto.payload", "Payload")

myproto.fields = { f_magic, f_version, f_type, f_flags, f_length, f_payload }

-- Message type names
local type_names = {
    [0x01] = "HANDSHAKE",
    [0x02] = "DATA",
    [0x03] = "ACK",
    [0x04] = "ERROR",
    [0x05] = "CLOSE"
}

-- Dissector function
function myproto.dissector(buffer, pinfo, tree)
    local length = buffer:len()
    if length < 8 then return end  -- Minimum header size

    pinfo.cols.protocol = myproto.name

    local subtree = tree:add(myproto, buffer(), "My Protocol Data")

    -- Parse header
    local magic = buffer(0, 1):uint()
    if magic ~= 0xAB then return 0 end  -- Not our protocol

    subtree:add(f_magic, buffer(0, 1))
    subtree:add(f_version, buffer(1, 1))

    local msg_type = buffer(2, 1):uint()
    local type_item = subtree:add(f_type, buffer(2, 1))
    type_item:append_text(" (" .. (type_names[msg_type] or "UNKNOWN") .. ")")

    subtree:add(f_flags, buffer(3, 1))

    local payload_len = buffer(4, 4):uint()
    subtree:add(f_length, buffer(4, 4))

    -- Parse payload if present
    if payload_len > 0 and length >= 8 + payload_len then
        subtree:add(f_payload, buffer(8, payload_len))
    end

    -- Update info column
    pinfo.cols.info = type_names[msg_type] or "Unknown"

    return 8 + payload_len
end

-- Register on TCP port
local tcp_port = DissectorTable.get("tcp.port")
tcp_port:add(12345, myproto)
```

## MCP Server Integration

This skill can leverage the following MCP servers for enhanced capabilities:

| Server | Description | Integration |
|--------|-------------|-------------|
| Wireshark MCP (sarthaksiddha) | Live capture and analysis | AI-powered packet inspection |
| WireMCP | Real-time traffic analysis | Threat detection |
| mcp-wireshark | Wireshark/tshark integration | IDE integration |
| Network Monitor MCP | Security analysis | Real-time monitoring |

### Wireshark MCP Server

```bash
# Install from npm
npm install -g @sarthaksiddha/wireshark-mcp

# Add to Claude
claude mcp add wireshark -- npx @sarthaksiddha/wireshark-mcp
```

**Capabilities:**
- Live traffic capture
- PCAP file analysis
- Protocol statistics
- TCP stream following
- JSON export

## Best Practices

1. **Use capture filters** - Reduce capture overhead at kernel level
2. **Rotate capture files** - Prevent disk exhaustion
3. **Set snap length** - Capture only needed bytes with `-s`
4. **Use ring buffers** - For continuous capture with `-W`
5. **Filter early** - BPF filters are more efficient than display filters
6. **Anonymize data** - Remove sensitive information before sharing

## Process Integration

This skill integrates with the following processes:
- `packet-capture-analysis.js` - Packet capture and analysis
- `protocol-dissector.js` - Protocol dissection
- `network-traffic-analyzer.js` - Traffic pattern analysis

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "analyze",
  "file": "capture.pcap",
  "status": "success",
  "summary": {
    "packets": 10000,
    "bytes": 5242880,
    "duration": 60.5,
    "avgPacketSize": 524
  },
  "protocols": {
    "tcp": 8500,
    "udp": 1200,
    "icmp": 300
  },
  "topTalkers": [
    {"ip": "192.168.1.100", "packets": 3000, "bytes": 1500000}
  ],
  "flows": 150,
  "artifacts": ["analysis.json", "flows.csv"]
}
```

## Constraints

- Require appropriate permissions for live capture
- Respect privacy and legal requirements
- Limit capture duration and size
- Filter sensitive protocols (credentials, PII)
- Store captures securely
