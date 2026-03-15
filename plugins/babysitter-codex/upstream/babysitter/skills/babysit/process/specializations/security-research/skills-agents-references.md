# Security Research and Vulnerability Analysis - Skills and Agents References

This document provides external references to community-created Claude skills, agents, plugins, and MCPs that can enhance the Security Research specialization processes.

---

## Table of Contents

1. [Overview](#overview)
2. [Reverse Engineering Tools](#reverse-engineering-tools)
3. [Fuzzing and Vulnerability Discovery](#fuzzing-and-vulnerability-discovery)
4. [Exploit Development and CTF](#exploit-development-and-ctf)
5. [Static Analysis Tools](#static-analysis-tools)
6. [Malware Analysis and Threat Intelligence](#malware-analysis-and-threat-intelligence)
7. [Web Application Security](#web-application-security)
8. [Penetration Testing and Red Team](#penetration-testing-and-red-team)
9. [Cloud and Container Security](#cloud-and-container-security)
10. [Mobile Security](#mobile-security)
11. [Smart Contract and Blockchain Security](#smart-contract-and-blockchain-security)
12. [Digital Forensics and Incident Response](#digital-forensics-and-incident-response)
13. [MITRE ATT&CK and Threat Frameworks](#mitre-attck-and-threat-frameworks)
14. [Comprehensive Security Platforms](#comprehensive-security-platforms)
15. [Curated Resource Collections](#curated-resource-collections)
16. [Skill-to-Reference Mapping](#skill-to-reference-mapping)

---

## Overview

This reference document maps community-created tools to the skills and agents identified in the skills-agents-backlog.md. These external resources can accelerate implementation or be integrated directly into the Security Research workflows.

### Reference Sources Searched
- GitHub Topics (claude-skills, claude-mcp, security)
- ComposioHQ/awesome-claude-skills
- Trail of Bits Skills Repository
- CCPlugins/awesome-claude-code-plugins
- Various security-focused MCP repositories

---

## Reverse Engineering Tools

### SK-001: Ghidra/IDA Reverse Engineering

| Resource | Description | URL |
|----------|-------------|-----|
| **GhydraMCP** | Multi-instance Ghidra plugin with HATEOAS REST API and MCP bridge for AI-assisted reverse engineering, binary analysis, and decompilation | https://github.com/starsong-consulting/GhydraMCP |
| **ReVa (Reverse Engineering Assistant)** | MCP server for reverse engineering tasks in Ghidra with state-of-the-art techniques to limit context rot and enable long-form RE tasks | https://github.com/cyberkaida/reverse-engineering-assistant |
| **Decyx** | AI-powered Ghidra extension for enhanced reverse engineering and binary analysis using Claude API | https://github.com/philsajdak/decyx |
| **IDA Pro MCP** | AI-powered reverse engineering assistant bridging IDA Pro with language models through MCP | https://github.com/mrexodia/ida-pro-mcp |
| **IDA Assistant** | IDA Pro plugin leveraging Claude-3 models for reverse engineering and binary analysis | https://github.com/stuxnet147/IDA-Assistant |
| **DWARF Expert** | Trail of Bits skill for working with DWARF debugging format for reverse engineering | https://github.com/trailofbits/skills |

### SK-016: Debugger Integration

| Resource | Description | URL |
|----------|-------------|-----|
| **DeepBits Claude Plugins** | Binary analysis capabilities including debugger integration via Ghidra, Qilin, and angr | https://github.com/DeepBitsTechnology/claude-plugins |

---

## Fuzzing and Vulnerability Discovery

### SK-002: Fuzzing Operations

| Resource | Description | URL |
|----------|-------------|-----|
| **Testing Handbook Skills** | Trail of Bits skills from appsec.guide covering fuzzers, sanitizers, and coverage analysis | https://github.com/trailofbits/skills |
| **Awesome-Fuzzing** | Curated list of fuzzing resources including AFL, libFuzzer, courses, and tools | https://github.com/secfigo/Awesome-Fuzzing |
| **Fuzzing-for-Security-Testing** | Learn fuzzing techniques: AFL, libFuzzer, custom fuzzers with examples and tools | https://github.com/aw-junaid/Fuzzing-for-Security-Testing |
| **FuzzingPaper** | Recent academic fuzzing papers and research | https://github.com/wcventure/FuzzingPaper |
| **FFUF Claude Skill** | Integrates ffuf web fuzzer allowing Claude to run fuzzing tasks and analyze results | https://github.com/jthack/ffuf_claude_skill |

---

## Exploit Development and CTF

### SK-003: Pwntools Exploitation / SK-014: Binary Exploitation

| Resource | Description | URL |
|----------|-------------|-----|
| **Pwntools** | CTF framework and exploit development library (Python) | https://github.com/Gallopsled/pwntools |
| **SecSkills** | Transform Claude Code into penetration testing assistant with specialized security skills for CTF and exploit development | https://github.com/trilwu/secskills |
| **Awesome CTF Resources** | List of CTF frameworks, libraries, and resources | https://github.com/devploit/awesome-ctf-resources |

---

## Static Analysis Tools

### SK-004: Static Analysis Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **Semgrep MCP** | Official MCP server for using Semgrep to scan code for security vulnerabilities | https://github.com/semgrep/mcp |
| **Static Analysis Skill** | Trail of Bits skill with CodeQL, Semgrep, and SARIF parsing | https://github.com/trailofbits/skills |
| **Semgrep Rule Creator** | Trail of Bits skill for developing custom Semgrep detection patterns | https://github.com/trailofbits/skills |
| **Semgrep Rule Variant Creator** | Adapts existing Semgrep rules across programming languages | https://github.com/trailofbits/skills |
| **Variant Analysis** | Trail of Bits skill to find similar vulnerabilities using pattern-based analysis | https://github.com/trailofbits/skills |
| **Differential Review** | Security-focused differential review of code changes with git history analysis | https://github.com/trailofbits/skills |
| **Sharp Edges** | Identifies error-prone APIs and dangerous design patterns | https://github.com/trailofbits/skills |

---

## Malware Analysis and Threat Intelligence

### SK-005: YARA Rules / SK-018: STIX/TAXII Intelligence

| Resource | Description | URL |
|----------|-------------|-----|
| **Malware Analysis Claude Skills** | Complete toolkit for professional malware analysis with 5 specialized skills covering triage, dynamic analysis, detection engineering (YARA, Sigma, Suricata) | https://github.com/gl0bal01/malware-analysis-claude-skills |
| **Threat Hunting with Sigma Rules** | Claude skill for threat detection using Sigma detection rules | https://github.com/jthack/threat-hunting-with-sigma-rules-skill |
| **Awesome YARA** | Curated list of YARA rules, tools, and resources | https://github.com/InQuest/awesome-yara |
| **DeepBits Claude Plugins** | Binary analysis for malware forensics and incident response | https://github.com/DeepBitsTechnology/claude-plugins |

---

## Web Application Security

### SK-006: Burp Suite/Web Security

| Resource | Description | URL |
|----------|-------------|-----|
| **Burp Suite MCP Server (Official)** | Official PortSwigger MCP Server for Burp Suite integration with AI clients | https://github.com/PortSwigger/mcp-server |
| **BurpMCP** | Burp Suite extension with MCP server for enhanced manual security testing | https://github.com/swgee/BurpMCP |
| **BurpAPISecuritySuite** | Burp extension for API security testing with 15 attack types, 108+ payloads, OWASP API Top 10 | https://github.com/Teycir/BurpAPISecuritySuite |
| **Burp Suite Project Parser** | Trail of Bits skill for extracting and searching Burp Suite project data | https://github.com/trailofbits/skills |
| **SulphurAPI** | Burp extension for automating OWASP API Top 10 detection | https://github.com/I-TRACING-ASO/SulphurAPI |
| **Next-Level Pentesting with Claude + Burp** | Guide for integrating Burp Suite Community with Claude via MCP | https://github.com/LvL23HT/Next-Level-Pentesting-Using-Claude-AI-with-Burp-Suite-Community-via-MCP |

---

## Penetration Testing and Red Team

### SK-017: Offensive Security

| Resource | Description | URL |
|----------|-------------|-----|
| **HexStrike AI** | Advanced MCP server for 150+ cybersecurity tools for automated pentesting, vulnerability discovery, bug bounty automation | https://github.com/0x4m4/hexstrike-ai |
| **PentestMCP** | MCP server exposing 20+ security assessment utilities (Nmap, Nuclei, ZAP, SQLMap) | https://github.com/ramkansal/pentestMCP |
| **Kali Linux MCP** | Docker containerized MCP server on Kali Linux with full security tool suite | https://github.com/k3nn3dy-ai/kali-mcp |
| **MetasploitMCP** | MCP Server for Metasploit Framework integration with Claude | https://github.com/GH05TCREW/MetasploitMCP |
| **Cobalt Strike MCP Server** | Official MCP server for Cobalt Strike C2 framework | https://github.com/cobalt-strike |
| **Offensive-MCP-AI** | Threat hunting automation, Purple Team simulator, malware development studio | https://github.com/CyberSecurityUP/Offensive-MCP-AI |
| **Project Astro** | MCP Server and Kali API Server with Claude Desktop integration | https://github.com/whit3rabbit0/project_astro |
| **SecSkills** | Claude Code plugin for red team operators, bug bounty hunters, and security researchers | https://github.com/trilwu/secskills |
| **Atomic Red Team** | Small and portable detection tests based on MITRE ATT&CK | https://github.com/redcanaryco/atomic-red-team |
| **Attack Arsenal** | Red team and adversary emulation resources by MITRE | https://github.com/mitre-attack/attack-arsenal |
| **Malleable C2 Profiles** | Collection of Cobalt Strike and Empire C2 profiles | https://github.com/BC-SECURITY/Malleable-C2-Profiles |

---

## Cloud and Container Security

### SK-012: Cloud Security Testing

| Resource | Description | URL |
|----------|-------------|-----|
| **AWS MCP Server** | Execute AWS CLI commands through MCP for cloud infrastructure management | https://github.com/alexei-led/aws-mcp-server |
| **AWS MCP (RafalWilinski)** | Talk with AWS using Claude - Better Amazon Q alternative | https://github.com/RafalWilinski/aws-mcp |
| **Azure/mcp-kubernetes** | MCP server enabling AI assistants to interact with Kubernetes clusters | https://github.com/Azure/mcp-kubernetes |
| **AKS-MCP** | MCP server for Azure Kubernetes Service with security features | https://github.com/Azure/aks-mcp |
| **Kubernetes MCP Server** | MCP server for Kubernetes and OpenShift with security capabilities | https://github.com/containers/kubernetes-mcp-server |
| **AWS Labs MCP Servers** | Official AWS MCP Servers collection | https://awslabs.github.io/mcp/ |

---

## Mobile Security

### SK-011: Mobile Security Testing

| Resource | Description | URL |
|----------|-------------|-----|
| **Frida Script Runner** | Web-based Frida framework with AI-assisted script generation via MCP for Android/iOS pentesting | https://github.com/z3n70/Frida-Script-Runner |
| **Mobile App Pentest Cheatsheet** | Android and iOS command cheatsheet for mobile penetration testing | https://github.com/mirfansulaiman/Command-Mobile-Penetration-Testing-Cheatsheet |
| **Awesome Hardware and IoT Hacking** | Comprehensive hardware and mobile security resources | https://github.com/CyberSecurityUP/Awesome-Hardware-and-IoT-Hacking |
| **Firebase APK Scanner** | Trail of Bits skill for scanning Android APKs for Firebase misconfigurations | https://github.com/trailofbits/skills |

---

## Smart Contract and Blockchain Security

### SK-013: Smart Contract Analysis

| Resource | Description | URL |
|----------|-------------|-----|
| **Slither MCP** | Trail of Bits MCP server for Slither static analysis of Solidity smart contracts | https://github.com/trailofbits/slither-mcp |
| **EVM MCP Tools** | Comprehensive blockchain analysis toolkit for Claude to audit smart contracts | https://github.com/0xGval/evm-mcp-tools |
| **Building Secure Contracts** | Trail of Bits smart contract security toolkit with vulnerability scanners for 6 blockchains | https://github.com/trailofbits/skills |
| **Entry Point Analyzer** | Trail of Bits skill for identifying state-changing functions in smart contracts | https://github.com/trailofbits/skills |
| **.context Smart Contract Auditing** | AI Agent instructions for smart contract auditing with industry-grade report findings | https://github.com/forefy/.context |
| **Constant Time Analysis** | Trail of Bits skill for detecting timing side-channels in cryptographic code | https://github.com/trailofbits/skills |

---

## Digital Forensics and Incident Response

### SK-015: Incident Forensics

| Resource | Description | URL |
|----------|-------------|-----|
| **Volatility MCP Server (bornpresident)** | MCP server integrating Volatility 3 memory forensics with Claude | https://github.com/bornpresident/Volatility-MCP-Server |
| **Volatility MCP (Gaffx)** | MCP server for Volatility 3.x with FastAPI integration | https://github.com/Gaffx/volatility-mcp |
| **Computer Forensics Skill** | Claude skill for digital forensics analysis and investigation | https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills |
| **Metadata Extraction Skill** | Extract and analyze file metadata for forensic purposes | https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills/skills/metadata-extraction |
| **File Deletion Skill** | Secure file deletion and data sanitization methods | https://github.com/mhattingpete/claude-skills-marketplace/tree/main/computer-forensics-skills/skills/file-deletion |

---

## MITRE ATT&CK and Threat Frameworks

### SK-009: MITRE ATT&CK

| Resource | Description | URL |
|----------|-------------|-----|
| **MITRE ATT&CK MCP** | MCP server for generating ATT&CK Navigator layers and threat analysis | https://github.com/stoyky/mitre-attack-mcp |
| **Atomic Threat Coverage** | Actionable analytics to combat threats based on MITRE ATT&CK | https://github.com/atc-project/atomic-threat-coverage |
| **Awesome MITRE ATT&CK** | Curated list of ATT&CK resources and tools | https://github.com/infosecn1nja/awesome-mitre-attack |

---

## Comprehensive Security Platforms

### Multi-Domain Security Tools

| Resource | Description | URL |
|----------|-------------|-----|
| **HexStrike AI** | 150+ cybersecurity tools, multi-agent architecture, autonomous vulnerability discovery | https://github.com/0x4m4/hexstrike-ai |
| **MCP-Scan** | Constrain, log and scan MCP connections for security vulnerabilities | https://github.com/invariantlabs-ai/mcp-scan |
| **Adversarial-Spec** | Multi-model specification refinement with security threat modeling | https://github.com/zscole/adversarial-spec |
| **Fix Review** | Trail of Bits skill for validating security fixes resolve audit findings | https://github.com/trailofbits/skills |
| **Audit Context Building** | Trail of Bits skill for constructing architectural understanding through code examination | https://github.com/trailofbits/skills |

---

## Curated Resource Collections

### Awesome Lists and Reference Repositories

| Resource | Description | URL |
|----------|-------------|-----|
| **Trail of Bits Skills** | Comprehensive security skills collection (20+ skills) | https://github.com/trailofbits/skills |
| **Awesome Claude Skills** | ComposioHQ curated list of Claude skills including security tools | https://github.com/ComposioHQ/awesome-claude-skills |
| **Awesome Claude Code Plugins** | Curated plugins including security and compliance tools | https://github.com/ccplugins/awesome-claude-code-plugins |
| **Awesome Claude Code Subagents** | Security engineer and DevOps security subagent definitions | https://github.com/VoltAgent/awesome-claude-code-subagents |
| **Hardware Hacking Tools** | Lists various tools for hardware security research | https://github.com/yogsec/Hardware-Hacking-Tools |

---

## Skill-to-Reference Mapping

### Phase 1: Core Security Research

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-001 | Ghidra/IDA RE | GhydraMCP, ReVa, Decyx, IDA Pro MCP |
| SK-002 | Fuzzing Operations | Testing Handbook Skills, FFUF Skill, Awesome-Fuzzing |
| SK-003 | Pwntools Exploitation | Pwntools, SecSkills |
| SK-004 | Static Analysis Tools | Semgrep MCP, Trail of Bits Static Analysis Skills |

### Phase 2: Web and Application Security

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-006 | Burp Suite/Web Security | Burp MCP Server, BurpMCP, BurpAPISecuritySuite |
| SK-011 | Mobile Security Testing | Frida Script Runner |
| SK-013 | Smart Contract Analysis | Slither MCP, EVM MCP Tools, Building Secure Contracts |

### Phase 3: Offensive Operations

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-009 | MITRE ATT&CK | mitre-attack-mcp, Atomic Threat Coverage |
| SK-017 | Offensive Security | HexStrike AI, MetasploitMCP, Kali MCP, PentestMCP |

### Phase 4: Threat Intelligence & Documentation

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-005 | YARA Rules | Malware Analysis Claude Skills, Awesome YARA |
| SK-010 | CVE/CWE Database | NVD Tools, GitHub Advisory Database |
| SK-018 | STIX/TAXII Intelligence | Threat Hunting Sigma Skills |

### Phase 5: Specialized Domains

| Skill ID | Skill Name | Primary References |
|----------|------------|-------------------|
| SK-008 | Container/Sandbox | Kubernetes MCP Server, AWS MCP Server |
| SK-012 | Cloud Security Testing | AWS MCP, Azure MCP-Kubernetes, AKS-MCP |
| SK-015 | Incident Forensics | Volatility MCP Server, Computer Forensics Skill |
| SK-019 | Hardware Security | Hardware Hacking Tools, DeepBits Plugins |
| SK-020 | AI/ML Security | Adversarial-Spec |

---

## Agent-to-Reference Mapping

| Agent ID | Agent Name | Relevant Tools |
|----------|------------|----------------|
| AG-001 | Vulnerability Researcher | Semgrep MCP, Variant Analysis, HexStrike AI |
| AG-002 | Exploit Developer | Pwntools, SecSkills, MetasploitMCP |
| AG-003 | Reverse Engineer | GhydraMCP, ReVa, IDA Pro MCP, DeepBits Plugins |
| AG-004 | Malware Analyst | Malware Analysis Claude Skills, Volatility MCP |
| AG-005 | Red Team Operator | HexStrike AI, Kali MCP, Offensive-MCP-AI |
| AG-006 | Web Security Researcher | Burp MCP Server, BurpAPISecuritySuite |
| AG-007 | Fuzzing Engineer | Testing Handbook Skills, FFUF Skill |
| AG-008 | Threat Intel Analyst | MITRE ATT&CK MCP, Threat Hunting Sigma |
| AG-009 | Smart Contract Auditor | Slither MCP, EVM MCP Tools |
| AG-010 | Security Report Writer | Adversarial-Spec, .context Auditing |
| AG-011 | CTF Challenge Creator | Pwntools, SecSkills, CTF Resources |
| AG-012 | Mobile Security Researcher | Frida Script Runner, Firebase APK Scanner |
| AG-013 | Cloud Security Researcher | AWS MCP, Azure MCP-Kubernetes |
| AG-014 | Purple Team Coordinator | MITRE ATT&CK MCP, Atomic Red Team |
| AG-015 | Hardware Security Researcher | Hardware Hacking Tools, DeepBits Plugins |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total References Found | 65 |
| Categories Covered | 15 |
| Skills with Direct References | 18/20 (90%) |
| Agents with Tool Mappings | 15/15 (100%) |
| MCP Server References | 28 |
| Claude Skill References | 22 |
| Curated Collections | 8 |

### Coverage Analysis

| Category | References |
|----------|------------|
| Reverse Engineering | 6 |
| Fuzzing | 5 |
| Exploit Development / CTF | 3 |
| Static Analysis | 7 |
| Malware Analysis / Threat Intel | 5 |
| Web Application Security | 6 |
| Penetration Testing / Red Team | 11 |
| Cloud / Container Security | 6 |
| Mobile Security | 4 |
| Smart Contract / Blockchain | 6 |
| Digital Forensics | 5 |
| MITRE ATT&CK | 3 |
| Comprehensive Platforms | 5 |
| Curated Collections | 5 |

---

## Notes

### Gaps Identified

1. **SK-007 (Network Protocol Analysis)**: Limited MCP-specific tools for Wireshark/Scapy integration
2. **SK-019 (Hardware Security)**: No dedicated MCP servers for JTAG/ChipWhisperer integration
3. **SK-020 (AI/ML Security)**: Limited adversarial ML tools with MCP integration

### Recommendations

1. **Priority Integration**: Trail of Bits skills repository offers the most comprehensive security tooling
2. **Quick Wins**: HexStrike AI provides 150+ tools in a single MCP server
3. **Enterprise Focus**: PortSwigger's official Burp MCP Server for web security workflows
4. **Memory Forensics**: Volatility MCP servers are mature and well-documented

---

**Created**: 2026-01-24
**Version**: 1.0.0
**Status**: Phase 5 - External References Documented
**Related Document**: skills-agents-backlog.md
