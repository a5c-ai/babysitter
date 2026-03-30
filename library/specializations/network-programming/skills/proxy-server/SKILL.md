---
name: proxy-server
description: Expert skill for proxy server implementation, configuration, and traffic interception
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Proxy Server Skill

Expert skill for proxy server implementation, configuration, and network traffic interception.

## Capabilities

- **Proxy Configuration**: Configure Squid, mitmproxy, Charles, and nginx proxy
- **HTTP CONNECT Tunneling**: Implement HTTP CONNECT for HTTPS tunneling
- **SOCKS Protocol**: Configure SOCKS4/SOCKS5 proxy servers
- **Transparent Proxying**: Implement transparent proxying with iptables/nftables
- **Traffic Analysis**: Analyze proxy traffic and generate reports
- **Debugging**: Debug proxy connection issues and SSL/TLS interception
- **PAC File Generation**: Generate Proxy Auto-Configuration (PAC) files
- **Caching**: Configure proxy caching strategies

## Tools and Dependencies

- `Squid` - Caching proxy server
- `mitmproxy` - Interactive HTTPS proxy
- `nginx` - HTTP and reverse proxy
- `iptables/nftables` - Linux firewall for transparent proxy
- `Charles` - HTTP proxy/monitor
- `tinyproxy` - Lightweight proxy

## Target Processes

- http-proxy-server.js
- socks5-proxy.js
- transparent-proxy.js

## Usage Examples

### Squid HTTP Proxy Configuration
```squid
http_port 3128
acl localnet src 10.0.0.0/8
http_access allow localnet
cache_dir ufs /var/spool/squid 10000 16 256
```

### Transparent Proxy with iptables
```bash
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3128
iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 443 -j REDIRECT --to-port 3129
```

### mitmproxy Interception
```bash
mitmproxy -p 8080 --mode transparent
mitmdump -w traffic.flow
```

### PAC File Example
```javascript
function FindProxyForURL(url, host) {
    if (isPlainHostName(host)) return "DIRECT";
    if (dnsDomainIs(host, ".internal.com")) return "DIRECT";
    return "PROXY proxy.example.com:8080";
}
```

## Quality Gates

- Proxy functionality verified
- SSL/TLS interception working
- Transparent mode operational
- Caching efficiency validated
- Access control tested
