---
name: load-balancer
description: Expert skill for load balancer configuration, algorithms, and high availability design
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Load Balancer Skill

Expert skill for load balancer configuration, algorithm implementation, and high availability design.

## Capabilities

- **HAProxy Configuration**: Configure HAProxy for L4/L7 load balancing with advanced features
- **NGINX Load Balancing**: Set up NGINX as a reverse proxy and load balancer
- **Algorithm Implementation**: Implement round-robin, weighted, least-connections, IP-hash, and consistent hashing
- **Health Checking**: Design comprehensive health check strategies (TCP, HTTP, custom)
- **Session Persistence**: Configure sticky sessions, cookie-based affinity, and source IP persistence
- **Load Distribution Analysis**: Analyze and optimize traffic distribution across backends
- **High Availability**: Configure HA pairs with failover using keepalived/VRRP
- **SSL/TLS Termination**: Configure TLS termination and re-encryption

## Tools and Dependencies

- `HAProxy` - High-performance TCP/HTTP load balancer
- `NGINX` - Web server and reverse proxy
- `keepalived` - HA and failover
- `LVS/IPVS` - Linux Virtual Server
- `haproxyctl` - HAProxy management

## Target Processes

- layer4-load-balancer.js
- layer7-load-balancer.js
- health-check-system.js

## Usage Examples

### HAProxy Backend Configuration
```haproxy
backend web_servers
    balance roundrobin
    option httpchk GET /health
    http-check expect status 200
    server web1 10.0.0.1:80 check weight 100
    server web2 10.0.0.2:80 check weight 100 backup
```

### NGINX Upstream Configuration
```nginx
upstream backend {
    least_conn;
    server 10.0.0.1:8080 weight=5;
    server 10.0.0.2:8080;
    keepalive 32;
}
```

### Health Check Verification
```bash
echo "show stat" | socat stdio /var/run/haproxy/admin.sock
```

## Quality Gates

- Backend health verification
- Load distribution validation
- Failover testing
- Performance benchmarking
- Session persistence verification
