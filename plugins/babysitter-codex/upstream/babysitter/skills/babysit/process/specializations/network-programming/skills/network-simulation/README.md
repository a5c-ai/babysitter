# Network Simulation Skill

Skill for network condition simulation, emulation, and chaos engineering.

## Overview

This skill provides specialized capabilities for simulating various network conditions including latency, packet loss, and bandwidth constraints. It supports chaos engineering practices for testing application resilience.

## Key Features

- Traffic control (tc) configuration
- WAN condition emulation with netem
- Network namespace isolation
- Virtual network topologies
- Chaos engineering scenarios

## When to Use

- Testing under degraded network conditions
- Simulating WAN latency and packet loss
- Creating isolated test environments
- Chaos engineering for resilience testing
- Performance testing under constraints

## Dependencies

- tc (traffic control)
- netem
- ip netns
- toxiproxy
- mininet
