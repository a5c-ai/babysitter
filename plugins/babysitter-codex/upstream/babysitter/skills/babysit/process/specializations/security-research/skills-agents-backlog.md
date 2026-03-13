# Security Research and Vulnerability Analysis - Skills and Agents Backlog

This document identifies specialized skills and agents (subagents) that could enhance the Security Research processes beyond general-purpose capabilities. These tools would provide domain-specific expertise, automation capabilities, and integration with specialized security tooling.

---

## Table of Contents

1. [Overview](#overview)
2. [Skills Backlog](#skills-backlog)
3. [Agents Backlog](#agents-backlog)
4. [Process-to-Skill/Agent Mapping](#process-to-skillagent-mapping)
5. [Shared Candidates](#shared-candidates)
6. [Implementation Priority](#implementation-priority)

---

## Overview

### Current State
All 32 implemented processes in this specialization currently use generic agent names for task execution. While functional, this approach lacks domain-specific optimizations that specialized skills and agents could provide.

### Goals
- Provide deep expertise in vulnerability research, exploit development, and reverse engineering
- Enable automated validation with real security tool integration
- Reduce context-switching overhead for domain-specific security tasks
- Improve accuracy and efficiency of security research operations
- Support offensive and defensive security workflows with appropriate tooling

---

## Skills Backlog

### SK-001: Ghidra/IDA Reverse Engineering Skill
**Slug**: `ghidra-ida-re`
**Category**: Reverse Engineering

**Description**: Deep integration with Ghidra and IDA Pro for binary analysis and reverse engineering.

**Capabilities**:
- Execute Ghidra headless analysis scripts
- Parse and interpret disassembly output
- Generate and run Ghidra Python scripts
- Analyze decompiled code for vulnerabilities
- Extract function signatures and data structures
- Create and apply Ghidra type definitions
- Export analysis artifacts (call graphs, data flows)
- Support IDA Pro scripting (IDAPython)

**Process Integration**:
- binary-reverse-engineering.js
- firmware-analysis.js
- malware-analysis.js
- vulnerability-root-cause-analysis.js

**Dependencies**: Ghidra CLI, IDA Pro (optional), Python

---

### SK-002: Fuzzing Operations Skill
**Slug**: `fuzzing-ops`
**Category**: Vulnerability Discovery

**Description**: Comprehensive fuzzing operations with AFL++, libFuzzer, and OSS-Fuzz integration.

**Capabilities**:
- Configure and launch AFL++ campaigns
- Build instrumented binaries with coverage
- Create and manage seed corpora
- Triage and deduplicate crash files
- Run afl-tmin and afl-cmin for minimization
- Monitor fuzzing progress and coverage
- Generate crash reproduction scripts
- Support libFuzzer and honggfuzz

**Process Integration**:
- fuzzing-campaign.js
- security-tool-development.js
- vulnerability-research-workflow.js

**Dependencies**: AFL++, LLVM, sanitizers (ASAN/MSAN/UBSAN)

---

### SK-003: Pwntools Exploitation Skill
**Slug**: `pwntools-exploit`
**Category**: Exploit Development

**Description**: Exploit development automation using pwntools framework.

**Capabilities**:
- Generate pwntools exploit templates
- Build ROP chains using ROPgadget
- Create shellcode with pwntools shellcraft
- Manage exploit process I/O (tubes)
- Handle remote and local exploitation
- Parse ELF binaries for gadgets
- Generate payload encoders
- Debug exploits with GDB integration

**Process Integration**:
- exploit-development.js
- shellcode-development.js
- capture-the-flag-challenges.js
- network-penetration-testing.js

**Dependencies**: pwntools, ROPgadget, GDB

---

### SK-004: Static Analysis Tools Skill
**Slug**: `static-analysis-tools`
**Category**: Code Analysis

**Description**: Integration with security-focused static analysis tools.

**Capabilities**:
- Execute Semgrep rules and custom patterns
- Run CodeQL queries for vulnerability detection
- Execute Bandit (Python), Brakeman (Ruby), etc.
- Parse and interpret static analysis results
- Generate custom detection rules
- Aggregate findings across tools
- Map findings to CWE/CVE identifiers
- Support SAST pipeline integration

**Process Integration**:
- static-code-analysis.js
- variant-analysis.js
- web-app-vuln-research.js
- api-security-research.js

**Dependencies**: Semgrep, CodeQL, language-specific analyzers

---

### SK-005: YARA Rules Skill
**Slug**: `yara-rules`
**Category**: Malware Analysis

**Description**: YARA rule creation, testing, and deployment.

**Capabilities**:
- Generate YARA rules from samples
- Validate YARA rule syntax
- Test rules against sample sets
- Optimize rules for performance
- Create rule metadata and documentation
- Support YARA modules (PE, ELF, etc.)
- Integrate with VirusTotal YARA
- Generate Sigma rules for correlation

**Process Integration**:
- malware-analysis.js
- threat-intelligence-research.js
- security-tool-development.js

**Dependencies**: YARA, yara-python

---

### SK-006: Burp Suite/Web Security Skill
**Slug**: `burp-websec`
**Category**: Web Security

**Description**: Web application security testing with Burp Suite integration.

**Capabilities**:
- Configure Burp Suite proxy and scanner
- Execute Burp extensions and macros
- Parse and analyze HTTP traffic
- Generate and send crafted requests
- Extract and analyze responses
- Support authentication handling
- Create and run active scan policies
- Generate web vulnerability reports

**Process Integration**:
- web-app-vuln-research.js
- api-security-research.js
- bug-bounty-workflow.js
- red-team-operations.js

**Dependencies**: Burp Suite (Pro), ZAP

---

### SK-007: Network Protocol Analysis Skill
**Slug**: `protocol-analysis`
**Category**: Network Security

**Description**: Network protocol capture, analysis, and fuzzing capabilities.

**Capabilities**:
- Capture and analyze pcap files
- Write Wireshark dissectors (Lua)
- Create Scapy packet crafting scripts
- Execute network fuzzing with boofuzz
- Parse protocol state machines
- Generate protocol documentation
- Support TLS/SSL analysis
- Create network-based exploits

**Process Integration**:
- protocol-reverse-engineering.js
- network-penetration-testing.js
- malware-analysis.js
- firmware-analysis.js

**Dependencies**: Wireshark/tshark, Scapy, boofuzz

---

### SK-008: Container/Sandbox Skill
**Slug**: `security-sandbox`
**Category**: Analysis Environment

**Description**: Isolated analysis environment management for malware and exploit testing.

**Capabilities**:
- Create and manage isolated VMs
- Configure Cuckoo Sandbox
- Set up REMnux/FlareVM environments
- Manage Docker-based analysis containers
- Configure network isolation
- Capture filesystem and registry changes
- Monitor process execution
- Create environment snapshots

**Process Integration**:
- malware-analysis.js
- exploit-development.js
- security-research-lab-setup.js
- dynamic-analysis-runtime-testing.js

**Dependencies**: VirtualBox/VMware, Docker, Cuckoo

---

### SK-009: MITRE ATT&CK Skill
**Slug**: `mitre-attack`
**Category**: Threat Intelligence

**Description**: MITRE ATT&CK framework mapping and analysis.

**Capabilities**:
- Map TTPs to ATT&CK techniques
- Generate ATT&CK Navigator layers
- Query ATT&CK STIX data
- Create attack patterns and campaigns
- Analyze technique coverage
- Generate detection mappings
- Support ATT&CK ICS and Mobile
- Create adversary emulation plans

**Process Integration**:
- red-team-operations.js
- purple-team-exercise.js
- threat-intelligence-research.js
- malware-analysis.js

**Dependencies**: ATT&CK STIX data, Navigator

---

### SK-010: CVE/CWE Database Skill
**Slug**: `cve-cwe-db`
**Category**: Vulnerability Management

**Description**: CVE and CWE database querying and management.

**Capabilities**:
- Query NVD for CVE details
- Search CWE database for weaknesses
- Calculate CVSS scores
- Generate CVE request templates
- Track CVE assignment status
- Map vulnerabilities to CWE
- Generate vulnerability advisories
- Support CPE matching

**Process Integration**:
- vulnerability-root-cause-analysis.js
- responsible-disclosure.js
- security-advisory-writing.js
- variant-analysis.js

**Dependencies**: NVD API, CWE database

---

### SK-011: Mobile Security Testing Skill
**Slug**: `mobile-security`
**Category**: Mobile Security

**Description**: Android and iOS application security testing.

**Capabilities**:
- Execute Frida scripts for hooking
- Analyze APK/IPA files
- Bypass SSL pinning
- Extract app data and credentials
- Perform dynamic instrumentation
- Support Objection framework
- Run MobSF analysis
- Generate mobile security reports

**Process Integration**:
- mobile-app-security-research.js
- bug-bounty-workflow.js
- red-team-operations.js

**Dependencies**: Frida, Objection, MobSF, adb/idevice tools

---

### SK-012: Cloud Security Testing Skill
**Slug**: `cloud-security`
**Category**: Cloud Security

**Description**: Multi-cloud security assessment and penetration testing.

**Capabilities**:
- Run Prowler/ScoutSuite assessments
- Execute Pacu for AWS attacks
- Analyze IAM policies
- Identify cloud misconfigurations
- Test S3 bucket permissions
- Enumerate cloud resources
- Generate cloud security reports
- Support AWS/GCP/Azure

**Process Integration**:
- cloud-security-research.js
- container-security-research.js
- bug-bounty-workflow.js
- red-team-operations.js

**Dependencies**: Prowler, ScoutSuite, Pacu, cloud CLIs

---

### SK-013: Smart Contract Analysis Skill
**Slug**: `smart-contract-analysis`
**Category**: Blockchain Security

**Description**: Ethereum and blockchain smart contract security analysis.

**Capabilities**:
- Execute Slither static analysis
- Run Mythril symbolic execution
- Analyze Solidity code patterns
- Detect reentrancy vulnerabilities
- Check for integer overflow
- Generate Echidna fuzz tests
- Support multiple EVM chains
- Create formal verification specs

**Process Integration**:
- smart-contract-auditing.js
- security-tool-development.js

**Dependencies**: Slither, Mythril, Echidna, Solidity compiler

---

### SK-014: Binary Exploitation Skill
**Slug**: `binary-exploitation`
**Category**: Exploit Development

**Description**: Advanced binary exploitation and mitigation bypass.

**Capabilities**:
- Identify exploitation primitives
- Analyze memory corruption types
- Calculate offsets and gadgets
- Bypass ASLR/PIE/NX/Canaries
- Generate heap exploitation chains
- Support kernel exploitation
- Create type confusion exploits
- Handle JIT compilation exploits

**Process Integration**:
- exploit-development.js
- shellcode-development.js
- binary-reverse-engineering.js
- capture-the-flag-challenges.js

**Dependencies**: GDB, pwndbg, ROPgadget, one_gadget

---

### SK-015: Incident Forensics Skill
**Slug**: `incident-forensics`
**Category**: Digital Forensics

**Description**: Digital forensics and incident response capabilities.

**Capabilities**:
- Analyze memory dumps with Volatility
- Parse filesystem artifacts
- Extract browser forensics
- Analyze Windows event logs
- Create forensic timelines
- Recover deleted files
- Analyze registry hives
- Generate forensic reports

**Process Integration**:
- malware-analysis.js
- threat-intelligence-research.js
- red-team-operations.js (post-operation)

**Dependencies**: Volatility, Autopsy, Sleuth Kit

---

### SK-016: Debugger Integration Skill
**Slug**: `debugger-integration`
**Category**: Dynamic Analysis

**Description**: Advanced debugging integration for vulnerability research.

**Capabilities**:
- Control GDB/LLDB sessions programmatically
- Set conditional breakpoints
- Trace function calls and returns
- Monitor memory allocations
- Analyze crash dumps
- Support WinDbg for Windows
- Enable rr for record/replay
- Create debugging scripts

**Process Integration**:
- dynamic-analysis-runtime-testing.js
- exploit-development.js
- binary-reverse-engineering.js
- vulnerability-root-cause-analysis.js

**Dependencies**: GDB, LLDB, WinDbg, pwndbg/gef

---

### SK-017: Offensive Security Skill
**Slug**: `offensive-security`
**Category**: Red Team

**Description**: Offensive security tools and techniques integration.

**Capabilities**:
- Execute Metasploit modules
- Generate Cobalt Strike payloads
- Create custom C2 channels
- Support Sliver/Havoc frameworks
- Perform credential harvesting
- Execute lateral movement
- Support phishing campaigns
- Generate custom implants

**Process Integration**:
- red-team-operations.js
- network-penetration-testing.js
- purple-team-exercise.js

**Dependencies**: Metasploit, Cobalt Strike (licensed), Sliver

---

### SK-018: STIX/TAXII Intelligence Skill
**Slug**: `stix-taxii`
**Category**: Threat Intelligence

**Description**: STIX/TAXII threat intelligence format and sharing.

**Capabilities**:
- Create STIX 2.1 bundles
- Query TAXII servers
- Generate threat reports
- Create indicator relationships
- Map to MITRE ATT&CK
- Support OpenIOC format
- Validate STIX syntax
- Share intelligence feeds

**Process Integration**:
- threat-intelligence-research.js
- malware-analysis.js
- security-advisory-writing.js

**Dependencies**: stix2 library, taxii2-client

---

### SK-019: Hardware Security Skill
**Slug**: `hardware-security`
**Category**: Hardware Security

**Description**: Hardware and embedded security research capabilities.

**Capabilities**:
- Interface with JTAG debuggers
- Analyze SPI/I2C communications
- Dump and analyze firmware
- Support fault injection
- Analyze side channels
- Interface with logic analyzers
- Support ChipWhisperer
- Create hardware exploitation tools

**Process Integration**:
- hardware-security-research.js
- firmware-analysis.js
- supply-chain-security.js

**Dependencies**: OpenOCD, Flashrom, ChipWhisperer

---

### SK-020: AI/ML Security Skill
**Slug**: `aiml-security`
**Category**: AI Security

**Description**: AI/ML model security testing and adversarial research.

**Capabilities**:
- Generate adversarial examples
- Test model robustness
- Perform model extraction attacks
- Test for data poisoning
- Analyze model fairness
- Support ART framework
- Create evasion attacks
- Test inference APIs

**Process Integration**:
- ai-ml-security-research.js
- supply-chain-security.js

**Dependencies**: Adversarial Robustness Toolbox (ART), Foolbox

---

---

## Agents Backlog

### AG-001: Vulnerability Researcher Agent
**Slug**: `vuln-researcher`
**Category**: Vulnerability Discovery

**Description**: Expert vulnerability researcher with deep knowledge of vulnerability classes and discovery techniques.

**Expertise Areas**:
- Memory corruption vulnerabilities (buffer overflow, UAF, heap)
- Logic vulnerabilities and authentication bypasses
- Injection vulnerabilities (SQL, command, LDAP)
- Cryptographic weaknesses and implementation flaws
- Race conditions and TOCTOU issues
- Deserialization vulnerabilities

**Persona**:
- Role: Senior Vulnerability Researcher
- Experience: 8+ years security research
- Background: Bug bounty, CVE authorship, security conferences

**Process Integration**:
- vulnerability-research-workflow.js (all phases)
- static-code-analysis.js (vulnerability identification)
- dynamic-analysis-runtime-testing.js (runtime testing)
- variant-analysis.js (pattern detection)

---

### AG-002: Exploit Developer Agent
**Slug**: `exploit-developer`
**Category**: Exploit Development

**Description**: Specialized agent for developing reliable proof-of-concept exploits.

**Expertise Areas**:
- Memory corruption exploitation techniques
- Modern mitigation bypass (ASLR, CFI, PAC)
- ROP/JOP chain construction
- Heap exploitation techniques
- Kernel exploitation
- Browser exploitation

**Persona**:
- Role: Exploit Development Specialist
- Experience: 7+ years exploit development
- Background: CTF competitions, Pwn2Own, exploit research

**Process Integration**:
- exploit-development.js (all phases)
- shellcode-development.js (all phases)
- vulnerability-root-cause-analysis.js (exploitability)
- capture-the-flag-challenges.js (pwn challenges)

---

### AG-003: Reverse Engineer Agent
**Slug**: `reverse-engineer`
**Category**: Reverse Engineering

**Description**: Expert reverse engineer for binary analysis and malware research.

**Expertise Areas**:
- x86/x64 and ARM assembly
- Static and dynamic analysis techniques
- Anti-debugging and anti-analysis bypass
- Packed and obfuscated code analysis
- Protocol reverse engineering
- Firmware analysis

**Persona**:
- Role: Principal Reverse Engineer
- Experience: 10+ years reverse engineering
- Background: Malware analysis, IDA expert, Ghidra contributor

**Process Integration**:
- binary-reverse-engineering.js (all phases)
- firmware-analysis.js (all phases)
- protocol-reverse-engineering.js (all phases)
- malware-analysis.js (static analysis, behavioral)

---

### AG-004: Malware Analyst Agent
**Slug**: `malware-analyst`
**Category**: Malware Analysis

**Description**: Specialized malware analysis and threat intelligence agent.

**Expertise Areas**:
- Static and dynamic malware analysis
- Behavioral analysis and sandbox evasion
- C2 protocol analysis
- IOC extraction and YARA creation
- Malware family classification
- Attribution analysis

**Persona**:
- Role: Senior Malware Analyst
- Experience: 7+ years malware analysis
- Background: Threat intelligence, APT tracking, IR

**Process Integration**:
- malware-analysis.js (all phases)
- threat-intelligence-research.js (malware intel)
- security-tool-development.js (detection rules)

---

### AG-005: Red Team Operator Agent
**Slug**: `red-team-operator`
**Category**: Red Team

**Description**: Offensive security operator for adversarial simulations.

**Expertise Areas**:
- Initial access techniques (phishing, exploitation)
- Persistence and evasion techniques
- Lateral movement and privilege escalation
- Active Directory attacks
- Cloud environment attacks
- MITRE ATT&CK mapping

**Persona**:
- Role: Senior Red Team Operator
- Experience: 8+ years penetration testing
- Background: OSCP, OSCE, red team engagements

**Process Integration**:
- red-team-operations.js (all phases)
- purple-team-exercise.js (adversary emulation)
- network-penetration-testing.js (all phases)

---

### AG-006: Web Security Researcher Agent
**Slug**: `web-security-researcher`
**Category**: Web Security

**Description**: Expert web application security researcher.

**Expertise Areas**:
- OWASP Top 10 vulnerabilities
- Client-side vulnerabilities (XSS, CSRF)
- Server-side vulnerabilities (SSRF, RCE)
- Authentication and authorization flaws
- API security vulnerabilities
- Modern web framework security

**Persona**:
- Role: Senior Web Security Researcher
- Experience: 6+ years web security
- Background: Bug bounty, web CTF, OWASP contributor

**Process Integration**:
- web-app-vuln-research.js (all phases)
- api-security-research.js (all phases)
- bug-bounty-workflow.js (web targets)

---

### AG-007: Fuzzing Engineer Agent
**Slug**: `fuzzing-engineer`
**Category**: Fuzzing

**Description**: Specialized fuzzing and automated vulnerability discovery agent.

**Expertise Areas**:
- Coverage-guided fuzzing (AFL++, libFuzzer)
- Grammar-based fuzzing
- Kernel and hypervisor fuzzing
- Network protocol fuzzing
- Crash triage and root cause analysis
- Harness development

**Persona**:
- Role: Fuzzing Research Engineer
- Experience: 5+ years fuzzing research
- Background: OSS-Fuzz contributor, fuzzing tool development

**Process Integration**:
- fuzzing-campaign.js (all phases)
- security-tool-development.js (harness development)
- vulnerability-research-workflow.js (automated discovery)

---

### AG-008: Threat Intelligence Analyst Agent
**Slug**: `threat-intel-analyst`
**Category**: Threat Intelligence

**Description**: Threat intelligence collection and analysis specialist.

**Expertise Areas**:
- APT tracking and attribution
- TTP extraction and mapping
- IOC generation and validation
- STIX/TAXII standards
- Dark web intelligence
- Geopolitical context analysis

**Persona**:
- Role: Senior Threat Intelligence Analyst
- Experience: 7+ years threat intelligence
- Background: Government/private sector CTI, MITRE ATT&CK

**Process Integration**:
- threat-intelligence-research.js (all phases)
- malware-analysis.js (attribution)
- security-advisory-writing.js (threat context)

---

### AG-009: Smart Contract Auditor Agent
**Slug**: `smart-contract-auditor`
**Category**: Blockchain Security

**Description**: Blockchain and smart contract security specialist.

**Expertise Areas**:
- Solidity security patterns
- DeFi vulnerability classes
- Reentrancy and flash loan attacks
- Access control and upgradeability
- Gas optimization and DoS
- Cross-chain security

**Persona**:
- Role: Senior Smart Contract Auditor
- Experience: 5+ years blockchain security
- Background: DeFi audits, bug bounty, Immunefi

**Process Integration**:
- smart-contract-auditing.js (all phases)

---

### AG-010: Security Report Writer Agent
**Slug**: `security-report-writer`
**Category**: Documentation

**Description**: Professional security documentation and report writing specialist.

**Expertise Areas**:
- Vulnerability report writing
- CVE and advisory documentation
- Bug bounty report optimization
- Executive summary creation
- Technical writing for security
- CVSS scoring and risk assessment

**Persona**:
- Role: Security Documentation Specialist
- Experience: 6+ years security reporting
- Background: Consulting, advisory publication

**Process Integration**:
- security-advisory-writing.js (all phases)
- responsible-disclosure.js (report creation)
- bug-bounty-workflow.js (report writing)
- security-research-publication.js (all phases)

---

### AG-011: CTF Challenge Creator Agent
**Slug**: `ctf-creator`
**Category**: Training

**Description**: CTF challenge design and development specialist.

**Expertise Areas**:
- Multi-category CTF design (web, pwn, crypto, RE)
- Difficulty calibration
- Anti-cheating measures
- Infrastructure deployment
- Solution documentation
- Educational content creation

**Persona**:
- Role: CTF Challenge Designer
- Experience: 5+ years CTF organization
- Background: CTF team member, challenge author

**Process Integration**:
- capture-the-flag-challenges.js (all phases)

---

### AG-012: Mobile Security Researcher Agent
**Slug**: `mobile-researcher`
**Category**: Mobile Security

**Description**: Android and iOS security research specialist.

**Expertise Areas**:
- Android application security
- iOS application security
- Mobile binary analysis
- Runtime hooking and instrumentation
- Mobile malware analysis
- MDM and enterprise security

**Persona**:
- Role: Senior Mobile Security Researcher
- Experience: 6+ years mobile security
- Background: Mobile bug bounty, app store security

**Process Integration**:
- mobile-app-security-research.js (all phases)

---

### AG-013: Cloud Security Researcher Agent
**Slug**: `cloud-researcher`
**Category**: Cloud Security

**Description**: Multi-cloud security research and penetration testing specialist.

**Expertise Areas**:
- AWS security and attacks
- Azure security and attacks
- GCP security and attacks
- Container and Kubernetes security
- Serverless security
- Cloud IAM analysis

**Persona**:
- Role: Senior Cloud Security Researcher
- Experience: 6+ years cloud security
- Background: Cloud pen testing, cloud bug bounty

**Process Integration**:
- cloud-security-research.js (all phases)
- container-security-research.js (all phases)

---

### AG-014: Purple Team Coordinator Agent
**Slug**: `purple-team-coordinator`
**Category**: Purple Team

**Description**: Purple team exercise coordination and detection validation specialist.

**Expertise Areas**:
- Adversary emulation planning
- Detection gap analysis
- Blue team collaboration
- MITRE ATT&CK coverage
- Detection engineering
- Metrics and reporting

**Persona**:
- Role: Purple Team Lead
- Experience: 7+ years offensive/defensive security
- Background: Both red and blue team experience

**Process Integration**:
- purple-team-exercise.js (all phases)
- red-team-operations.js (detection testing)

---

### AG-015: Hardware Security Researcher Agent
**Slug**: `hardware-researcher`
**Category**: Hardware Security

**Description**: Hardware and embedded systems security specialist.

**Expertise Areas**:
- JTAG and debug interfaces
- Side-channel analysis
- Fault injection attacks
- Secure boot bypass
- Firmware extraction and analysis
- IoT security

**Persona**:
- Role: Hardware Security Researcher
- Experience: 6+ years hardware security
- Background: Embedded systems, hardware CTF

**Process Integration**:
- hardware-security-research.js (all phases)
- firmware-analysis.js (hardware aspects)
- supply-chain-security.js (hardware supply chain)

---

---

## Process-to-Skill/Agent Mapping

| Process File | Primary Skills | Primary Agents |
|-------------|---------------|----------------|
| vulnerability-research-workflow.js | SK-004, SK-010 | AG-001 |
| static-code-analysis.js | SK-004, SK-010 | AG-001 |
| dynamic-analysis-runtime-testing.js | SK-008, SK-016 | AG-001 |
| fuzzing-campaign.js | SK-002, SK-016 | AG-007 |
| vulnerability-root-cause-analysis.js | SK-001, SK-016, SK-010 | AG-001, AG-002 |
| variant-analysis.js | SK-004, SK-010 | AG-001 |
| binary-reverse-engineering.js | SK-001, SK-016 | AG-003 |
| firmware-analysis.js | SK-001, SK-019 | AG-003, AG-015 |
| protocol-reverse-engineering.js | SK-007, SK-001 | AG-003 |
| malware-analysis.js | SK-001, SK-005, SK-008, SK-009 | AG-004 |
| exploit-development.js | SK-003, SK-014, SK-016 | AG-002 |
| shellcode-development.js | SK-003, SK-014 | AG-002 |
| web-app-vuln-research.js | SK-006, SK-004 | AG-006 |
| api-security-research.js | SK-006, SK-004 | AG-006 |
| mobile-app-security-research.js | SK-011 | AG-012 |
| cloud-security-research.js | SK-012 | AG-013 |
| container-security-research.js | SK-012, SK-008 | AG-013 |
| smart-contract-auditing.js | SK-013 | AG-009 |
| hardware-security-research.js | SK-019 | AG-015 |
| supply-chain-security.js | SK-019, SK-020 | AG-015 |
| ai-ml-security-research.js | SK-020 | AG-001 |
| red-team-operations.js | SK-017, SK-009 | AG-005 |
| purple-team-exercise.js | SK-017, SK-009 | AG-014, AG-005 |
| threat-intelligence-research.js | SK-018, SK-005, SK-009 | AG-008 |
| security-research-lab-setup.js | SK-008, SK-016 | AG-003 |
| security-tool-development.js | SK-002, SK-004, SK-005 | AG-007 |
| capture-the-flag-challenges.js | SK-003, SK-014, SK-006 | AG-011 |
| network-penetration-testing.js | SK-007, SK-017 | AG-005 |
| bug-bounty-workflow.js | SK-006, SK-011, SK-012 | AG-006, AG-010 |
| responsible-disclosure.js | SK-010 | AG-010 |
| security-advisory-writing.js | SK-010, SK-018 | AG-010 |
| security-research-publication.js | SK-010 | AG-010 |

---

## Shared Candidates

These skills and agents are strong candidates for extraction to a shared library as they apply across multiple specializations.

### Shared Skills

| ID | Skill | Potential Shared Specializations |
|----|-------|----------------------------------|
| SK-004 | Static Analysis Tools | Software Development, Code Quality, DevSecOps |
| SK-006 | Burp Suite/Web Security | Web Development, QA Testing |
| SK-008 | Container/Sandbox | DevOps, Software Development |
| SK-010 | CVE/CWE Database | DevOps (Security Scanning), Software Architecture |
| SK-012 | Cloud Security Testing | DevOps, Cloud Architecture |
| SK-016 | Debugger Integration | Software Development, QA Testing |
| SK-018 | STIX/TAXII Intelligence | DevOps (SIEM), Incident Response |
| SK-013 | Smart Contract Analysis | Cryptography/Blockchain Specialization |

### Shared Agents

| ID | Agent | Potential Shared Specializations |
|----|-------|----------------------------------|
| AG-006 | Web Security Researcher | Web Development (Security Reviews) |
| AG-010 | Security Report Writer | Technical Documentation |
| AG-013 | Cloud Security Researcher | DevOps/SRE (Security Assessments) |
| AG-008 | Threat Intel Analyst | DevOps (Security Operations) |

---

## Implementation Priority

### Phase 1: Core Security Research (High Impact)
1. **SK-001**: Ghidra/IDA RE - Foundation for all binary analysis
2. **SK-002**: Fuzzing Operations - Automated vulnerability discovery
3. **SK-003**: Pwntools Exploitation - Essential for exploit development
4. **SK-004**: Static Analysis Tools - Universal code security analysis

### Phase 2: Core Agents (High Impact)
1. **AG-001**: Vulnerability Researcher - Highest process coverage
2. **AG-002**: Exploit Developer - Critical for PoC development
3. **AG-003**: Reverse Engineer - Essential for binary analysis
4. **AG-004**: Malware Analyst - Key for threat analysis

### Phase 3: Web and Application Security
1. **SK-006**: Burp Suite/Web Security
2. **SK-011**: Mobile Security Testing
3. **SK-013**: Smart Contract Analysis
4. **AG-006**: Web Security Researcher
5. **AG-009**: Smart Contract Auditor
6. **AG-012**: Mobile Security Researcher

### Phase 4: Offensive Operations
1. **SK-017**: Offensive Security
2. **SK-009**: MITRE ATT&CK
3. **AG-005**: Red Team Operator
4. **AG-014**: Purple Team Coordinator

### Phase 5: Threat Intelligence & Documentation
1. **SK-005**: YARA Rules
2. **SK-018**: STIX/TAXII Intelligence
3. **SK-010**: CVE/CWE Database
4. **AG-008**: Threat Intel Analyst
5. **AG-010**: Security Report Writer

### Phase 6: Specialized Domains
1. **SK-012**: Cloud Security Testing
2. **SK-019**: Hardware Security
3. **SK-020**: AI/ML Security
4. **AG-013**: Cloud Security Researcher
5. **AG-015**: Hardware Security Researcher
6. **AG-007**: Fuzzing Engineer
7. **AG-011**: CTF Challenge Creator

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Skills Identified | 20 |
| Agents Identified | 15 |
| Shared Skill Candidates | 8 |
| Shared Agent Candidates | 4 |
| Total Processes Covered | 32 |

---

**Created**: 2026-01-24
**Updated**: 2026-01-24
**Version**: 1.1.0
**Status**: Phase 6 - All Skills and Agents Implemented
**Completed**: All 20 skills and 15 agents have been created with SKILL.md/AGENT.md and README.md files
