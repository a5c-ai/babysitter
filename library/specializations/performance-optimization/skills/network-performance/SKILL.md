---
name: network-performance
description: Expert skill for network performance analysis and optimization. Analyze packet captures, identify network latency bottlenecks, configure TCP tuning parameters, analyze connection pooling behavior, debug TLS handshake performance, and optimize HTTP/2 and HTTP/3 settings.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: network-io
  backlog-id: SK-016
---

# network-performance

You are **network-performance** - a specialized skill for network performance analysis and optimization. This skill provides expert capabilities for identifying and resolving network-related performance bottlenecks across TCP/IP, TLS, HTTP/2, and HTTP/3 protocols.

## Overview

This skill enables AI-powered network performance operations including:
- Analyzing packet captures with tcpdump/Wireshark patterns
- Identifying network latency bottlenecks
- Configuring TCP tuning parameters (buffers, congestion control)
- Analyzing connection pooling behavior
- Debugging TLS handshake performance
- Optimizing HTTP/2 and HTTP/3 settings
- Implementing network compression strategies

## Prerequisites

- tcpdump, tshark (Wireshark CLI)
- ss, netstat, ip utilities
- curl with HTTP/2 and HTTP/3 support
- Optional: iperf3, mtr, traceroute
- Root/admin access for packet capture

## Capabilities

### 1. TCP Performance Analysis

Analyze and optimize TCP performance:

```bash
# Capture TCP packets for analysis
tcpdump -i eth0 -nn -tttt -s 0 \
  'tcp port 443 and host api.example.com' \
  -w capture.pcap -c 10000

# Analyze with tshark
tshark -r capture.pcap -q -z io,stat,1,"tcp"

# Extract TCP RTT statistics
tshark -r capture.pcap \
  -T fields -e tcp.analysis.ack_rtt \
  -Y "tcp.analysis.ack_rtt" | \
  awk '{sum+=$1; count++} END {print "Avg RTT:", sum/count*1000, "ms"}'

# Check for retransmissions
tshark -r capture.pcap -q -z expert,error
tshark -r capture.pcap -Y "tcp.analysis.retransmission" | wc -l

# Connection state analysis with ss
ss -tni state established '( sport = :443 or dport = :443 )'
```

### 2. TCP Tuning Configuration

Configure optimal TCP parameters:

```bash
# /etc/sysctl.conf for Linux TCP tuning

# Buffer sizes (for high-bandwidth connections)
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.core.rmem_default = 1048576
net.core.wmem_default = 1048576

# TCP buffer auto-tuning
net.ipv4.tcp_rmem = 4096 1048576 16777216
net.ipv4.tcp_wmem = 4096 1048576 16777216

# Congestion control (BBR recommended for modern networks)
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr

# Connection handling
net.ipv4.tcp_max_syn_backlog = 65535
net.core.somaxconn = 65535
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 5

# TIME_WAIT handling
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10000 65535

# Window scaling and SACK
net.ipv4.tcp_window_scaling = 1
net.ipv4.tcp_sack = 1
net.ipv4.tcp_timestamps = 1

# Apply changes
sysctl -p
```

### 3. Connection Pooling Analysis

Analyze and optimize connection pooling:

```bash
# Monitor connection states
watch -n 1 'ss -s'

# Count connections by state
ss -tan | awk '{print $1}' | sort | uniq -c | sort -rn

# Find connection pools exhaustion
ss -tn state time-wait | wc -l
ss -tn state established dst :443 | wc -l

# Analyze connection duration with tcpdump
tcpdump -nn -tt -r capture.pcap 'tcp[tcpflags] & (tcp-syn|tcp-fin) != 0' | \
  awk '{print $1, $3, $5}' | sort
```

```python
# Connection pool configuration (Python requests)
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

# Configure connection pooling
session = requests.Session()
adapter = HTTPAdapter(
    pool_connections=100,        # Number of connection pools
    pool_maxsize=100,            # Connections per pool
    max_retries=Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    ),
    pool_block=False             # Don't block when pool is full
)
session.mount('https://', adapter)
session.mount('http://', adapter)

# Configure timeouts
response = session.get(
    'https://api.example.com/data',
    timeout=(3.05, 30)  # (connect_timeout, read_timeout)
)
```

### 4. TLS Handshake Optimization

Analyze and optimize TLS performance:

```bash
# Measure TLS handshake time
curl -w "DNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nTotal: %{time_total}s\n" \
  -o /dev/null -s https://api.example.com/health

# Detailed TLS handshake analysis
openssl s_client -connect api.example.com:443 -msg -trace 2>&1 | \
  grep -E "^(<<<|>>>|SSL)"

# Check TLS session resumption
for i in {1..3}; do
  curl -w "TLS time: %{time_appconnect}s\n" -o /dev/null -s https://api.example.com/
done

# Verify TLS 1.3 support
curl -v --tlsv1.3 https://api.example.com/ 2>&1 | grep TLSv1.3
```

```nginx
# Nginx TLS optimization
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;

# Session resumption
ssl_session_cache shared:SSL:50m;
ssl_session_timeout 1d;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;

# 0-RTT (Early Data) for TLS 1.3
ssl_early_data on;
```

### 5. HTTP/2 Optimization

Configure HTTP/2 for optimal performance:

```nginx
# Nginx HTTP/2 configuration
server {
    listen 443 ssl http2;

    # HTTP/2 specific settings
    http2_max_concurrent_streams 128;
    http2_max_field_size 8k;
    http2_max_header_size 32k;
    http2_recv_buffer_size 256k;
    http2_idle_timeout 3m;

    # Server push (use sparingly)
    http2_push /css/main.css;
    http2_push /js/app.js;

    # Connection settings
    keepalive_timeout 65;
    keepalive_requests 1000;
}
```

```bash
# Verify HTTP/2 multiplexing
curl -w '\nHTTP Version: %{http_version}\n' --http2 \
  -o /dev/null -s https://api.example.com/

# Check HTTP/2 support
curl -I --http2 -s https://api.example.com/ | head -1

# Analyze HTTP/2 frames
nghttp -v https://api.example.com/
```

### 6. HTTP/3 (QUIC) Optimization

Configure HTTP/3 for modern networks:

```bash
# Test HTTP/3 support
curl --http3 -I https://api.example.com/

# Analyze QUIC connection
curl --http3 -v https://api.example.com/ 2>&1 | grep -i quic
```

```nginx
# Nginx HTTP/3 (with nginx-quic)
server {
    listen 443 ssl http2;
    listen 443 quic reuseport;

    # HTTP/3 specific
    add_header Alt-Svc 'h3=":443"; ma=86400';

    ssl_protocols TLSv1.3;  # Required for QUIC
}
```

### 7. Network Latency Analysis

Comprehensive latency analysis:

```bash
# MTR for path analysis
mtr --report -c 100 api.example.com

# Traceroute with timing
traceroute -I api.example.com

# DNS latency
time dig +short api.example.com

# Per-hop latency analysis
tcptraceroute api.example.com 443

# Application-level latency breakdown
curl -w @- -o /dev/null -s "https://api.example.com/health" <<'EOF'
     DNS Lookup:  %{time_namelookup}s\n
  TCP Connect:  %{time_connect}s\n
  TLS Handshake:  %{time_appconnect}s\n
  Server Processing:  %{time_starttransfer}s\n
  Total Time:  %{time_total}s\n
  Download Speed:  %{speed_download} bytes/s\n
EOF
```

### 8. Bandwidth and Throughput Testing

Measure network throughput:

```bash
# iperf3 server
iperf3 -s

# iperf3 client (TCP)
iperf3 -c server.example.com -t 30 -P 4

# iperf3 with JSON output
iperf3 -c server.example.com -t 10 -J > results.json

# Test download throughput
curl -o /dev/null -w "Speed: %{speed_download} bytes/s\n" \
  https://cdn.example.com/large-file.bin

# Measure with multiple connections
aria2c -x 16 -s 16 https://cdn.example.com/large-file.bin --dry-run
```

## MCP Server Integration

This skill can leverage the following MCP servers:

| Server | Description | Use Case |
|--------|-------------|----------|
| mcp-monitor | System monitoring | Network I/O metrics |
| mcp-kubernetes | K8s networking | Service mesh analysis |
| Cilium Hubble (via Azure K8s MCP) | Network monitoring | Kubernetes network flow |

## Best Practices

### TCP Tuning

1. **Start with defaults** - Modern kernels have good auto-tuning
2. **Measure before changing** - Baseline current performance
3. **Enable BBR** - Better than CUBIC for most networks
4. **Right-size buffers** - Match to bandwidth-delay product

### TLS Optimization

1. **Use TLS 1.3** - Faster handshake, better security
2. **Enable session resumption** - Reduce repeated handshake costs
3. **OCSP stapling** - Avoid client OCSP lookups
4. **Certificate optimization** - Use ECDSA, keep chain short

### HTTP/2 & HTTP/3

1. **Domain sharding is harmful** - HTTP/2 multiplexing makes it worse
2. **Server push carefully** - Can waste bandwidth if misused
3. **Connection coalescing** - Consolidate domains when possible
4. **Consider QUIC** - Better for mobile and lossy networks

## Process Integration

This skill integrates with the following processes:
- `network-io-optimization.js` - Network optimization workflows
- `disk-io-profiling.js` - Related I/O analysis
- `latency-analysis-reduction` - End-to-end latency optimization

## Output Format

When executing operations, provide structured output:

```json
{
  "operation": "analyze-network-performance",
  "status": "success",
  "analysis": {
    "latency": {
      "dnsLookup": "15ms",
      "tcpConnect": "25ms",
      "tlsHandshake": "45ms",
      "serverProcessing": "120ms",
      "total": "205ms"
    },
    "tcp": {
      "retransmissionRate": "0.1%",
      "avgRtt": "28ms",
      "congestionControl": "bbr",
      "windowSize": "64KB"
    },
    "tls": {
      "version": "TLSv1.3",
      "cipher": "TLS_AES_256_GCM_SHA384",
      "sessionResumed": true
    }
  },
  "recommendations": [
    {
      "category": "tls",
      "issue": "TLS 1.2 in use",
      "action": "Upgrade to TLS 1.3 for faster handshakes",
      "estimatedImprovement": "50ms"
    }
  ]
}
```

## Error Handling

### Common Issues

| Error | Cause | Resolution |
|-------|-------|------------|
| High retransmission rate | Packet loss, congestion | Check network path, enable FEC |
| Slow DNS resolution | DNS server latency | Use local resolver, enable caching |
| TLS handshake timeout | Server overload | Enable session resumption |
| Connection pool exhaustion | High concurrency | Increase pool size, check TIME_WAIT |
| HTTP/2 stream limits | Too many concurrent requests | Increase stream limits |

## Constraints

- Packet capture requires appropriate permissions
- Network tuning affects entire system
- Test in non-production before applying changes
- Consider regulatory requirements for packet capture
- Document all tuning changes for troubleshooting
