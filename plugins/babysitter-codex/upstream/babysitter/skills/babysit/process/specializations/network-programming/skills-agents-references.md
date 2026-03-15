# Network Programming and Protocols - Skills and Agents References

This document provides curated links to community-created Claude skills, agents, plugins, and MCP (Model Context Protocol) servers that align with the identified skills and agents in the Network Programming specialization backlog.

---

## Table of Contents

1. [Overview](#overview)
2. [Packet Capture and Protocol Analysis](#packet-capture-and-protocol-analysis)
3. [Network Security and Penetration Testing](#network-security-and-penetration-testing)
4. [TLS/SSL and Certificate Management](#tlsssl-and-certificate-management)
5. [HTTP and API Testing](#http-and-api-testing)
6. [gRPC and Protocol Buffers](#grpc-and-protocol-buffers)
7. [Load Balancing and Traffic Management](#load-balancing-and-traffic-management)
8. [Network Scanning and DNS](#network-scanning-and-dns)
9. [Proxy and Traffic Interception](#proxy-and-traffic-interception)
10. [Container Networking](#container-networking)
11. [WebSocket and Real-Time Communication](#websocket-and-real-time-communication)
12. [General MCP Resources](#general-mcp-resources)
13. [Skill-to-Reference Mapping](#skill-to-reference-mapping)

---

## Overview

This reference document maps community-created tools and MCP servers to the skills and agents identified in the `skills-agents-backlog.md`. These resources can accelerate implementation or serve as integration points for the Network Programming specialization.

**Note**: MCP (Model Context Protocol) is an open standard developed by Anthropic that enables AI assistants like Claude to securely connect with external tools and data sources.

---

## Packet Capture and Protocol Analysis

### Wireshark MCP Server (sarthaksiddha)

**Repository**: [https://github.com/sarthaksiddha/Wireshark-mcp](https://github.com/sarthaksiddha/Wireshark-mcp)

**Description**: Model Context Protocol server for Claude and similar AI systems, providing network packet capture and analysis functions.

**Capabilities**:
- Live traffic capture using tshark
- PCAP file analysis
- Protocol statistics generation
- TCP stream following
- Export to JSON format

**Relevant Skills**: SK-003 (Packet Capture Skill)

---

### Wireshark MCP Server (A-G-U-P-T-A)

**Repository**: [https://github.com/A-G-U-P-T-A/wireshark-mcp](https://github.com/A-G-U-P-T-A/wireshark-mcp)

**Description**: TShark/Wireshark MCP server for network packet analysis via Claude, using PyShark functionality.

**Capabilities**:
- Live packet capture and analysis
- Traffic pattern analysis
- PCAP/PCAPNG file reading
- Protocol layer decoding

**Relevant Skills**: SK-003 (Packet Capture Skill)

---

### WireMCP

**Repository**: [https://github.com/0xKoda/WireMCP](https://github.com/0xKoda/WireMCP)

**Description**: An MCP for WireShark (tshark) that empowers LLMs with real-time network traffic analysis capability.

**Capabilities**:
- `capture_packets` - Captures live network traffic and returns packet data as JSON
- `get_summary_stats` - Provides protocol hierarchy statistics
- `get_conversations` - Shows TCP/UDP conversation statistics
- `check_threats` - Checks captured IPs against the URLhaus blacklist
- `check_ip_threats` - Performs detailed threat intelligence lookups
- `analyze_pcap` - Analyzes PCAP files
- `extract_credentials` - Scans PCAP files for potential credentials

**Relevant Skills**: SK-003 (Packet Capture Skill), SK-010 (Network Testing Skill)

**Relevant Agents**: AG-005 (Network Analysis Expert Agent)

---

### mcp-wireshark (PyPI)

**Package**: [https://pypi.org/project/mcp-wireshark/](https://pypi.org/project/mcp-wireshark/)

**Description**: An MCP server that integrates Wireshark/tshark with AI tools and IDEs.

**Capabilities**:
- Capture live network traffic
- Parse .pcap files
- Apply display filters
- Follow TCP streams
- Export to JSON

**Relevant Skills**: SK-003 (Packet Capture Skill)

---

### Network Monitor MCP Server

**Reference**: [https://lobehub.com/mcp/skapa-xyz-network-monitor-mcp](https://lobehub.com/mcp/skapa-xyz-network-monitor-mcp)

**Description**: A Model Context Protocol server for real-time network packet monitoring and security analysis.

**Capabilities**:
- Real-time packet monitoring
- Security threat identification
- Network traffic inspection

**Relevant Skills**: SK-003 (Packet Capture Skill), SK-010 (Network Testing Skill)

---

## Network Security and Penetration Testing

### pentest-mcp

**Repository**: [https://github.com/DMontgomery40/pentest-mcp](https://github.com/DMontgomery40/pentest-mcp)

**Description**: An MCP server for professional penetration testers including STDIO/HTTP/SSE support.

**Capabilities**:
- Network Reconnaissance with Nmap (full port scanning, service detection, OS fingerprinting)
- Web Directory Enumeration with Gobuster
- Web Vulnerability Scanning with Nikto
- GPU-Accelerated Cracking with Hashcat (WPA/WPA2, NTLM, bcrypt, 300+ hash types)
- OAuth 2.1 authentication support

**Relevant Skills**: SK-010 (Network Testing Skill), SK-011 (Protocol Fuzzing Skill)

**Relevant Agents**: AG-003 (Network Security Expert Agent), AG-010 (Security Testing Agent)

---

### HexStrike AI

**Repository**: [https://github.com/0x4m4/hexstrike-ai](https://github.com/0x4m4/hexstrike-ai)

**Description**: An advanced MCP server that lets AI agents autonomously run 150+ cybersecurity tools for automated pentesting, vulnerability discovery, bug bounty automation, and security research.

**Capabilities**:
- Multi-agent architecture with autonomous AI agents
- Intelligent decision-making
- Vulnerability intelligence
- 150+ integrated security tools

**Relevant Skills**: SK-011 (Protocol Fuzzing Skill)

**Relevant Agents**: AG-003 (Network Security Expert Agent), AG-010 (Security Testing Agent)

---

### PentestThinkingMCP

**Repository**: [https://github.com/ibrahimsaleem/PentestThinkingMCP](https://github.com/ibrahimsaleem/PentestThinkingMCP)

**Description**: A systematic, AI-powered penetration testing reasoning engine for attack path planning, CTF/HTB solving, and automated pentest workflows.

**Capabilities**:
- Beam Search and Monte Carlo Tree Search (MCTS)
- Attack step scoring
- Tool recommendations
- CTF and real-world pentest workflows

**Relevant Agents**: AG-003 (Network Security Expert Agent), AG-010 (Security Testing Agent)

---

### mcp-for-security

**Repository**: [https://github.com/cyproxio/mcp-for-security](https://github.com/cyproxio/mcp-for-security)

**Description**: A collection of Model Context Protocol servers for popular security tools.

**Capabilities**:
- SQLMap integration
- FFUF support
- NMAP integration
- Masscan support
- Nuclei (template-based vulnerability scanner)
- SSL/TLS configuration analyzer

**Relevant Skills**: SK-004 (TLS/SSL Security Skill), SK-010 (Network Testing Skill), SK-011 (Protocol Fuzzing Skill)

---

### PentestAgent

**Repository**: [https://github.com/GH05TCREW/PentestAgent](https://github.com/GH05TCREW/PentestAgent)

**Description**: All-in-one offensive security toolbox with AI agent and MCP architecture.

**Capabilities**:
- Integrates Nmap, Metasploit, FFUF, SQLMap
- Pentesting, bug bounty hunting, threat hunting
- RAG-based responses with local knowledge base
- Intelligent Pentesting Task Trees (PTT)

**Relevant Agents**: AG-003 (Network Security Expert Agent), AG-010 (Security Testing Agent)

---

### bugbounty-mcp-server

**Repository**: [https://github.com/gokulapap/bugbounty-mcp-server](https://github.com/gokulapap/bugbounty-mcp-server)

**Description**: Comprehensive MCP server for bug bounty hunting and web application penetration testing.

**Capabilities**:
- Security testing through natural language
- SSL certificate log analysis via Certificate Transparency

**Relevant Agents**: AG-003 (Network Security Expert Agent)

---

### awesome-mcp-security

**Repository**: [https://github.com/Puliczek/awesome-mcp-security](https://github.com/Puliczek/awesome-mcp-security)

**Description**: A curated collection focused on MCP security concerns, best practices, and security advisories.

**Relevant Skills**: SK-004 (TLS/SSL Security Skill)

---

## TLS/SSL and Certificate Management

### TLS MCP Server

**Repository**: [https://github.com/malaya-zemlya/tls-mcp](https://github.com/malaya-zemlya/tls-mcp)

**Reference**: [https://lobehub.com/mcp/malaya-zemlya-tls-mcp](https://lobehub.com/mcp/malaya-zemlya-tls-mcp)

**Description**: Small MCP server for analyzing TLS certificates using OpenSSL and zlint.

**Capabilities**:
- Fetch and analyze TLS certificates
- Single `fetch_certificate` tool with flexible options
- OpenSSL or Python cryptography analysis
- Async operations for better performance
- Local certificate processing (no external data transmission)
- zlint integration for certificate linting

**Relevant Skills**: SK-004 (TLS/SSL Security Skill)

**Relevant Agents**: AG-003 (Network Security Expert Agent)

---

## HTTP and API Testing

### Postman MCP Server

**Repository**: [https://github.com/postmanlabs/postman-mcp-server](https://github.com/postmanlabs/postman-mcp-server)

**Documentation**: [https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/set-up-postman-mcp-server/](https://learning.postman.com/docs/developer/postman-api/postman-mcp-server/set-up-postman-mcp-server/)

**Description**: Connect Postman to AI tools for API access, collection management, and workflow automation.

**Capabilities**:
- API Testing with Postman collections
- Code synchronization
- Collection management
- Workspace and environment management
- Automatic spec creation
- 100+ tools in full configuration

**Installation**: `claude mcp add --transport http postman https://mcp.postman.com/minimal --header "Authorization: Bearer <POSTMAN_API_KEY>"`

**Relevant Skills**: SK-006 (HTTP Protocol Skill), SK-010 (Network Testing Skill)

---

### mcp-rest-api

**Repository**: [https://github.com/dkmaker/mcp-rest-api](https://github.com/dkmaker/mcp-rest-api)

**Description**: A TypeScript-based MCP server that enables testing of REST APIs through Claude and other MCP clients.

**Capabilities**:
- Test and interact with any REST API endpoints
- Direct API testing from development environment

**Relevant Skills**: SK-006 (HTTP Protocol Skill)

---

### OpenAPI MCP Integration

**Reference**: [https://openapi.com/mcp/claude](https://openapi.com/mcp/claude)

**Description**: Integration between Claude and the OpenAPI API Marketplace.

**Capabilities**:
- Natural language to API operations
- Always up-to-date data and services
- Process automation

**Relevant Skills**: SK-006 (HTTP Protocol Skill)

---

## gRPC and Protocol Buffers

### protoc-gen-go-mcp (Redpanda)

**Reference**: [https://www.redpanda.com/blog/turn-grpc-api-into-mcp-server](https://www.redpanda.com/blog/turn-grpc-api-into-mcp-server)

**Description**: Protocol Buffers compiler plugin that generates Go code to translate between MCP and gRPC.

**Capabilities**:
- Generate MCP servers from gRPC/ConnectRPC APIs
- Protocol buffer to MCP translation
- Open-sourced under Apache 2.0

**Relevant Skills**: SK-007 (gRPC Protocol Skill), SK-015 (Serialization Skill)

---

### gRPC-to-MCP Proxy (Adiom)

**Reference**: [https://medium.com/@adkomyagin/how-to-connect-claude-ai-to-enterprise-services-with-mcp-8783c1dd7b61](https://medium.com/@adkomyagin/how-to-connect-claude-ai-to-enterprise-services-with-mcp-8783c1dd7b61)

**Description**: Lightweight proxy that translates between MCP and gRPC using protobuf specifications.

**Capabilities**:
- MCP to gRPC translation
- Inline comments for tool descriptions
- Enterprise service connectivity

**Relevant Skills**: SK-007 (gRPC Protocol Skill), SK-015 (Serialization Skill)

---

### MCP Grpcurl Server

**Reference**: [https://playbooks.com/mcp/wricardo-grpc-reflection](https://playbooks.com/mcp/wricardo-grpc-reflection)

**Description**: MCP server enabling interaction with gRPC services through grpcurl.

**Capabilities**:
- Invoke gRPC methods
- List services
- Retrieve service descriptions

**Relevant Skills**: SK-007 (gRPC Protocol Skill)

---

### Google Cloud gRPC Transport for MCP

**Reference**: [https://cloud.google.com/blog/products/networking/grpc-as-a-native-transport-for-mcp](https://cloud.google.com/blog/products/networking/grpc-as-a-native-transport-for-mcp)

**Description**: Google Cloud working on pluggable transports in MCP SDK with native gRPC support.

**Benefits**:
- Binary encoding (protocol buffers) shrinks message sizes by up to 10x vs JSON
- Lower latency for tool calls
- Reduced network costs
- Smaller resource footprint

**Relevant Skills**: SK-007 (gRPC Protocol Skill), SK-015 (Serialization Skill)

---

## Load Balancing and Traffic Management

### HAProxy MCP Server

**Reference**: [https://mcp.so/server/haproxy-mcp-server/tuannvm](https://mcp.so/server/haproxy-mcp-server/tuannvm)

**Description**: Server designed to work with HAProxy for load balancing and traffic distribution management.

**Relevant Skills**: SK-008 (Load Balancer Skill)

**Relevant Agents**: AG-006 (Load Balancer Expert Agent)

---

### mcgravity (MCP Load Balancer)

**Description**: Proxy tool for composing multiple MCP servers into one unified endpoint. Scales AI tools by load balancing requests across multiple MCP servers.

**Capabilities**:
- Multi-server composition
- Request load balancing
- Similar functionality to Nginx for web servers

**Relevant Skills**: SK-008 (Load Balancer Skill)

---

### pluggedin-mcp-proxy (VeriTeknik)

**Description**: Comprehensive proxy server combining multiple MCP servers into a single interface.

**Capabilities**:
- Discovery and management of tools, prompts, resources
- Playground for debugging MCP servers
- Visibility features across servers

**Relevant Skills**: SK-008 (Load Balancer Skill), SK-013 (Proxy Server Skill)

---

### HAProxy Load Balancing for Streamable MCP

**Reference**: [https://thenewstack.io/scaling-ai-interactions-how-to-load-balance-streamable-mcp/](https://thenewstack.io/scaling-ai-interactions-how-to-load-balance-streamable-mcp/)

**Description**: Guide on using HAProxy for load balancing Streamable MCP servers.

**Key Features**:
- Session persistence using `mcp-session-id` header
- `stick on hdr(mcp-session-id)` for session affinity
- Event-driven architecture for high concurrency
- Invalid request filtering at edge

**Relevant Skills**: SK-008 (Load Balancer Skill)

**Relevant Agents**: AG-006 (Load Balancer Expert Agent)

---

## Network Scanning and DNS

### NmapMCP

**Repository**: [https://github.com/0xPratikPatil/NmapMCP](https://github.com/0xPratikPatil/NmapMCP)

**Reference**: [https://mcpservers.org/servers/0xPratikPatil/NmapMCP](https://mcpservers.org/servers/0xPratikPatil/NmapMCP)

**Description**: Robust integration of Nmap scanning tool with MCP, enabling network scanning within MCP-compatible environments.

**Capabilities**:
- Top Ports Scanning
- DNS Brute Force for subdomain discovery
- List Scan for active hosts inventory
- OS Detection
- Version Detection
- ARP Discovery for LAN environments
- Disable DNS Resolution option

**Installation**: `npx -y @smithery/cli install @0xPratikPatil/nmapmcp --client claude`

**Relevant Skills**: SK-009 (DNS Protocol Skill), SK-010 (Network Testing Skill)

**Relevant Agents**: AG-005 (Network Analysis Expert Agent)

---

### nmap-mcp-server (PhialsBasement)

**Repository**: [https://github.com/PhialsBasement/nmap-mcp-server](https://github.com/PhialsBasement/nmap-mcp-server)

**Description**: MCP server enabling AI assistants to perform network scanning operations using NMAP.

**Capabilities**:
- Standardized interface for AI models to interact with NMAP
- Network analysis support

**Relevant Skills**: SK-010 (Network Testing Skill)

---

### Security MCP Server (HydraMCP)

**Description**: Production-ready MCP implementation providing AI agents with secure access to network security tools.

**Integrated Tools**:
- DNSRecon - DNS Reconnaissance tool
- Nmap - Network scanner
- Zmap - Internet scanner
- SQLMap - SQL injection scanner
- WPScan - WordPress security scanner
- Holehe - Email registration checker
- OCR - Optical Character Recognition

**Relevant Skills**: SK-009 (DNS Protocol Skill), SK-010 (Network Testing Skill), SK-011 (Protocol Fuzzing Skill)

---

## Proxy and Traffic Interception

### Mitmproxy MCP Server

**Reference**: [https://playbooks.com/mcp/lucasoeth/mitmproxy-mcp](https://playbooks.com/mcp/lucasoeth/mitmproxy-mcp)

**Deep Dive**: [https://skywork.ai/skypage/en/mitmproxy-mcp-server-ai-engineer/1980464062349824000](https://skywork.ai/skypage/en/mitmproxy-mcp-server-ai-engineer/1980464062349824000)

**Description**: MCP server providing network traffic analysis capabilities through mitmproxy.

**Capabilities**:
- Intercept, inspect, modify, and replay web traffic
- Automated testing
- API reverse engineering
- Security auditing
- TLS traffic interception

**Configuration**: Requires `NODE_EXTRA_CA_CERTS` for TLS traffic interception.

**Relevant Skills**: SK-013 (Proxy Server Skill)

**Relevant Agents**: AG-008 (Proxy/Tunneling Expert Agent)

---

### api-mitmproxy (SecOpsAgentKit)

**Reference**: [https://claude-plugins.dev/skills/@AgentSecOps/SecOpsAgentKit/api-mitmproxy](https://claude-plugins.dev/skills/@AgentSecOps/SecOpsAgentKit/api-mitmproxy)

**Description**: Claude skill for mitmproxy integration in security operations.

**Relevant Skills**: SK-013 (Proxy Server Skill)

---

### MCP MITM Mem0

**Reference**: [https://lobehub.com/mcp/terrymunro-mcp-mitm-mem0](https://lobehub.com/mcp/terrymunro-mcp-mitm-mem0)

**Description**: Memory service for Claude via MITM proxy and MCP using Mem0 SaaS.

**Capabilities**:
- Intercepts conversations via MITM proxy
- Provides memory access through MCP

**Relevant Skills**: SK-013 (Proxy Server Skill)

---

### cc-trace

**Reference**: [https://claude-plugins.dev/skills/@alexfazio/cc-trace/SKILL.md](https://claude-plugins.dev/skills/@alexfazio/cc-trace/SKILL.md)

**Description**: Claude skill for tracing and debugging network requests.

**Relevant Skills**: SK-003 (Packet Capture Skill), SK-013 (Proxy Server Skill)

---

## Container Networking

### Kubernetes MCP Server (containers)

**Repository**: [https://github.com/containers/kubernetes-mcp-server](https://github.com/containers/kubernetes-mcp-server)

**Description**: Model Context Protocol server for Kubernetes and OpenShift.

**Capabilities**:
- Generic Kubernetes Resources CRUD operations
- Systematic troubleshooting flow for pods
- Non-destructive mode for read and create/update-only access
- Secrets masking

**Installation**: `claude mcp add kubernetes -- npx mcp-server-kubernetes`

**Relevant Skills**: SK-014 (Network Simulation Skill)

---

### mcp-server-kubernetes (Flux159)

**Repository**: [https://github.com/Flux159/mcp-server-kubernetes](https://github.com/Flux159/mcp-server-kubernetes)

**Description**: MCP Server for Kubernetes management commands.

**Capabilities**:
- Natural language Kubernetes management
- kubectl, helm, istioctl, argocd support
- Multi-provider compatibility

**Relevant Skills**: SK-014 (Network Simulation Skill)

---

### Docker MCP Server

**Repository**: [https://github.com/QuantGeekDev/docker-mcp](https://github.com/QuantGeekDev/docker-mcp)

**Description**: A Docker MCP Server for Model Context Protocol.

**Relevant Skills**: SK-014 (Network Simulation Skill)

---

### Docker MCP Toolkit

**Reference**: [https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/](https://www.docker.com/blog/connect-mcp-servers-to-claude-desktop-with-mcp-toolkit/)

**Description**: Secure, containerized environment for Claude to work safely.

**Capabilities**:
- Isolated container execution
- Deploy pods, manage services
- Helm chart handling
- Complete reproducibility

**Relevant Skills**: SK-014 (Network Simulation Skill)

---

## WebSocket and Real-Time Communication

### MCP-WebSocket Architecture

**Reference**: [https://skywork.ai/skypage/en/A-Comprehensive-Guide-to-MCP-WebSocket-Servers-for-AI-Engineers/1972577355133153280](https://skywork.ai/skypage/en/A-Comprehensive-Guide-to-MCP-WebSocket-Servers-for-AI-Engineers/1972577355133153280)

**Description**: Comprehensive guide on MCP-WebSocket server architecture.

**Key Features**:
- WebSocket transport with MCP data layer (JSON-RPC 2.0)
- Interoperability with MCP primitives (Tools, Resources)
- Bridge tools like `mcp-ws` for stdio to WebSocket

**Relevant Skills**: SK-005 (WebSocket Skill)

**Relevant Agents**: AG-007 (WebSocket/Real-Time Expert Agent)

---

### claude-agent-server

**Repository**: [https://github.com/dzhng/claude-agent-server](https://github.com/dzhng/claude-agent-server)

**Description**: Run Claude Agent in a sandbox, control via WebSocket.

**Capabilities**:
- WebSocket server wrapping Claude Agent SDK
- Real-time bidirectional communication
- E2B sandbox deployment
- TypeScript client library

**Relevant Skills**: SK-005 (WebSocket Skill)

**Relevant Agents**: AG-007 (WebSocket/Real-Time Expert Agent)

---

### Claude-Flow Platform

**Repository Wiki**: [https://github.com/ruvnet/claude-flow/wiki](https://github.com/ruvnet/claude-flow/wiki)

**Description**: Agent orchestration platform for Claude with distributed swarm intelligence.

**Capabilities**:
- Multi-agent swarms
- Autonomous workflow coordination
- Real-time communication between Claude Code instances
- Context sharing and task handoffs
- RAG integration

**Relevant Skills**: SK-005 (WebSocket Skill)

**Relevant Agents**: AG-007 (WebSocket/Real-Time Expert Agent)

---

## General MCP Resources

### Official MCP Servers Repository

**Repository**: [https://github.com/modelcontextprotocol/servers](https://github.com/modelcontextprotocol/servers)

**Description**: Official Model Context Protocol Servers from Anthropic.

---

### awesome-mcp-servers (punkpeye)

**Repository**: [https://github.com/punkpeye/awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

**Description**: A curated list of awesome Model Context Protocol servers.

---

### awesome-mcp-servers (TensorBlock)

**Repository**: [https://github.com/TensorBlock/awesome-mcp-servers](https://github.com/TensorBlock/awesome-mcp-servers)

**Description**: Comprehensive collection with 7,260+ MCP servers indexed.

---

### awesome-mcp-lists (collabnix)

**Repository**: [https://github.com/collabnix/awesome-mcp-lists](https://github.com/collabnix/awesome-mcp-lists)

**Description**: Curated list of MCP Servers, Clients, and Toolkits including Docker MCP Toolkit.

---

### MCP Servers Directory

**Website**: [https://mcp.so/](https://mcp.so/)

**Description**: Online directory of MCP servers.

---

### Claude MCP Servers

**Website**: [https://www.claube.ai/](https://www.claube.ai/)

**Description**: Collection of Claude-compatible MCP servers.

---

### MCP Inspector

**Description**: Official interactive UI and proxy tool for debugging MCP servers.

**Capabilities**:
- Real-time communication logs
- Protocol validation
- Support for stdio, SSE, and remote connections
- Tool inspection and testing

---

## Skill-to-Reference Mapping

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-001 | Socket Programming | Claude-Flow, Docker MCP Toolkit |
| SK-002 | Protocol Parser | protoc-gen-go-mcp, gRPC-to-MCP Proxy |
| SK-003 | Packet Capture | Wireshark MCP (multiple), WireMCP, Network Monitor MCP |
| SK-004 | TLS/SSL Security | TLS MCP Server, mcp-for-security |
| SK-005 | WebSocket | MCP-WebSocket Architecture, claude-agent-server, Claude-Flow |
| SK-006 | HTTP Protocol | Postman MCP Server, mcp-rest-api, OpenAPI MCP |
| SK-007 | gRPC Protocol | protoc-gen-go-mcp, MCP Grpcurl Server, Google Cloud gRPC Transport |
| SK-008 | Load Balancer | HAProxy MCP Server, mcgravity, pluggedin-mcp-proxy |
| SK-009 | DNS Protocol | NmapMCP (DNS Brute Force), Security MCP Server (DNSRecon) |
| SK-010 | Network Testing | pentest-mcp, NmapMCP, mcp-for-security, Postman MCP |
| SK-011 | Protocol Fuzzing | HexStrike AI, pentest-mcp, mcp-for-security |
| SK-012 | Event Loop | MCP-WebSocket Architecture, Claude-Flow |
| SK-013 | Proxy Server | Mitmproxy MCP Server, api-mitmproxy, MCP MITM Mem0 |
| SK-014 | Network Simulation | Kubernetes MCP Server, Docker MCP Toolkit |
| SK-015 | Serialization | protoc-gen-go-mcp, gRPC-to-MCP Proxy |

---

## Agent-to-Reference Mapping

| Agent ID | Agent Name | Primary References |
|----------|------------|-------------------|
| AG-001 | Network Systems Architect | Claude-Flow, Kubernetes MCP Server |
| AG-002 | Protocol Implementation Expert | protoc-gen-go-mcp, gRPC-to-MCP Proxy |
| AG-003 | Network Security Expert | pentest-mcp, HexStrike AI, PentestAgent, TLS MCP Server |
| AG-004 | High-Performance Networking | Claude-Flow, MCP-WebSocket Architecture |
| AG-005 | Network Analysis Expert | Wireshark MCP, WireMCP, NmapMCP |
| AG-006 | Load Balancer Expert | HAProxy MCP Server, mcgravity |
| AG-007 | WebSocket/Real-Time Expert | MCP-WebSocket Architecture, claude-agent-server |
| AG-008 | Proxy/Tunneling Expert | Mitmproxy MCP Server, api-mitmproxy |
| AG-009 | Network Testing Expert | Postman MCP Server, NmapMCP, mcp-for-security |
| AG-010 | Security Testing Agent | HexStrike AI, PentestThinkingMCP, PentestAgent |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Packet Capture Tools | 5 |
| Network Security/Pentest Tools | 7 |
| TLS/SSL Tools | 2 |
| HTTP/API Testing Tools | 3 |
| gRPC/Protobuf Tools | 4 |
| Load Balancing Tools | 4 |
| Network Scanning/DNS Tools | 3 |
| Proxy/Interception Tools | 4 |
| Container Networking Tools | 4 |
| WebSocket/Real-Time Tools | 3 |
| General MCP Resources | 7 |
| **Total References** | **46** |
| **Categories** | **11** |

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - Skills and Agents References Compiled
**Next Step**: Evaluate and integrate selected tools into specialization processes
