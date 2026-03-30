---
name: network-simulation
description: Skill for network condition simulation, emulation, and chaos engineering
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

# Network Simulation Skill

Expert skill for network condition simulation, emulation, and chaos engineering testing environments.

## Capabilities

- **Traffic Control**: Configure tc (traffic control) for latency, bandwidth, and packet loss simulation
- **Network Namespaces**: Set up network namespaces for network isolation testing
- **WAN Emulation**: Emulate WAN conditions with netem (delay, jitter, loss, corruption)
- **Virtual Topologies**: Create virtual network topologies for testing
- **Packet Manipulation**: Simulate packet loss, reordering, duplication, and corruption
- **Degraded Conditions Testing**: Test applications under degraded network conditions
- **Chaos Scenarios**: Generate chaos engineering scenarios for resilience testing
- **Container Networking**: Configure Docker/Kubernetes network simulation

## Tools and Dependencies

- `tc` - Traffic control for Linux
- `netem` - Network emulator
- `ip netns` - Network namespaces
- `mininet` - Network emulator
- `toxiproxy` - TCP proxy for chaos testing
- `comcast` - Network simulation tool
- `pumba` - Container chaos testing

## Target Processes

- network-testing-framework.js
- load-testing-tool.js
- protocol-fuzzer.js
- tcp-socket-server.js

## Usage Examples

### Latency Simulation
```bash
tc qdisc add dev eth0 root netem delay 100ms 20ms distribution normal
tc qdisc change dev eth0 root netem delay 200ms 40ms 25% correlation
```

### Packet Loss Simulation
```bash
tc qdisc add dev eth0 root netem loss 5% 25%
tc qdisc add dev eth0 root netem loss gemodel 1% 10% 70% 0.1%
```

### Bandwidth Limiting
```bash
tc qdisc add dev eth0 root tbf rate 1mbit burst 32kbit latency 400ms
```

### Network Namespace Isolation
```bash
ip netns add test_ns
ip link add veth0 type veth peer name veth1
ip link set veth1 netns test_ns
ip netns exec test_ns ip addr add 10.0.0.2/24 dev veth1
ip netns exec test_ns ip link set veth1 up
```

### Toxiproxy Chaos
```bash
toxiproxy-cli create -l localhost:6379 -u localhost:6380 redis_proxy
toxiproxy-cli toxic add -t latency -a latency=1000 redis_proxy
```

## Quality Gates

- Network conditions applied correctly
- Application behavior under degraded conditions verified
- Chaos scenarios executed successfully
- Recovery testing completed
- Performance baselines established
