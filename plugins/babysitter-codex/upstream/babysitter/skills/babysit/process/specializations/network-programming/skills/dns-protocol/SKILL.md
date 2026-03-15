---
name: dns-protocol
description: Expert skill for DNS protocol implementation, configuration, and service discovery
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# DNS Protocol Skill

Expert skill for DNS protocol implementation, server configuration, and DNS-based service discovery.

## Capabilities

- **DNS Query Execution**: Execute dig/nslookup queries and interpret results comprehensively
- **Record Type Analysis**: Work with all DNS record types (A, AAAA, CNAME, MX, TXT, SRV, NS, SOA, PTR)
- **DNS Server Configuration**: Configure BIND, CoreDNS, and other DNS servers
- **DNSSEC Implementation**: Implement and validate DNSSEC signing and verification
- **DNS Traffic Analysis**: Analyze DNS traffic patterns and detect anomalies
- **Service Discovery**: Design DNS-based service discovery (SRV records, DNS-SD)
- **Zone Management**: Manage DNS zones, transfers, and delegation
- **TTL Optimization**: Optimize TTL values for different use cases

## Tools and Dependencies

- `dig` - DNS lookup utility
- `nslookup` - Query DNS servers
- `BIND` - Berkeley Internet Name Domain
- `CoreDNS` - Cloud-native DNS server
- `dnssec-tools` - DNSSEC utilities
- `tcpdump` - DNS traffic capture

## Target Processes

- realtime-messaging-system.js (service discovery)
- layer7-load-balancer.js (DNS-based routing)
- http-proxy-server.js (DNS resolution)

## Usage Examples

### Comprehensive DNS Query
```bash
dig +trace +all example.com
dig @8.8.8.8 example.com ANY
```

### SRV Record Lookup
```bash
dig _http._tcp.example.com SRV
```

### DNSSEC Validation
```bash
dig +dnssec +multi example.com
delv @8.8.8.8 example.com +rtrace
```

### Zone Transfer Test
```bash
dig @ns1.example.com example.com AXFR
```

## Quality Gates

- DNS resolution verification
- Record propagation testing
- DNSSEC chain validation
- Response time benchmarking
- Zone configuration validation
