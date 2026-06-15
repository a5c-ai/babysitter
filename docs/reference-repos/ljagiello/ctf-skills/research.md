# ljagiello/ctf-skills

## Metadata
- **Stars**: 1,332
- **Description**: Agent skills for solving CTF challenges - web exploitation, binary pwn, crypto, reverse engineering, forensics, OSINT, and more
- **License**: MIT
- **Last pushed**: 2026-04-10 (very active)
- **Topics**: agent-skills, claude-code, claude-code-skills, codex, codex-cli, ctf, gemini, gemini-cli, opencode, security
- **Fork**: No

## Classification
- **Archetype**: mega-skill-pack
- **Domain**: Security / CTF challenges

## Structure
- 9 category directories, each with SKILL.md + reference files:
  - `ctf-web/` (16 files) -- SQL injection, XSS, SSTI, SSRF, JWT, prototype pollution, etc.
  - `ctf-pwn/` (15 files) -- buffer overflow, ROP, heap exploitation, kernel exploitation
  - `ctf-crypto/` (13 files) -- RSA, AES, ECC, PRNG, lattice attacks
  - `ctf-reverse/` (14 files) -- binary analysis, custom VMs, WASM, anti-debug, Frida
  - `ctf-forensics/` (13 files) -- disk/memory forensics, steganography, network captures
  - `ctf-osint/` (3 files) -- geolocation, social media, DNS recon
  - `ctf-malware/` (3 files) -- obfuscated scripts, C2 traffic, PE analysis
  - `ctf-misc/` (11 files) -- pyjails, encodings, RF/SDR, Docker escape
  - `ctf-writeup/` -- writeup generation
- `solve-challenge/` -- orchestrator skill that delegates to category skills
- `scripts/install_ctf_tools.sh` -- tool installer
- `tests/` -- test infrastructure
- Install via: `npx skills add ljagiello/ctf-skills`

## Key Observations
- Extraordinarily comprehensive security knowledge base
- Each category SKILL.md is a massive reference document with techniques, tools, and patterns
- The `solve-challenge` orchestrator is a process-like pattern: analyze challenge -> classify -> delegate to specialist
- Multi-harness support (Claude Code, Codex, Gemini, OpenCode)
- The sheer depth of ctf-web (covering hundreds of specific attack patterns) is remarkable
- MIT license -- permissive for reuse

## Extractable Value

### Processes
- **CTF challenge solving orchestration** -- placement: `specializations/security/ctf-solver.js`
  - Challenge analysis and classification
  - Tool setup verification
  - Category-specific solving strategies
  - Writeup generation
  - Maps well to babysitter's task/breakpoint model (human approval at exploit steps)
- **Security audit workflow** -- placement: `specializations/security/web-security-audit.js`
  - Systematic web vulnerability scanning using the ctf-web knowledge
  - Covers: SQLi, XSS, SSTI, SSRF, JWT, prototype pollution, deserialization
  - Breakpoints for exploitation confirmation
- **Binary analysis workflow** -- placement: `specializations/security/binary-analysis.js`
  - Reverse engineering pipeline
  - Anti-debug/anti-VM detection and bypass
  - Symbolic execution integration (angr, Triton)

### Plugin Ideas
- **ctf-toolkit plugin** -- babysitter marketplace plugin
  - install.md: run scripts/install_ctf_tools.sh, configure tool paths
  - Skills: challenge solver orchestration, per-category solving skills
  - Reference knowledge bundled as compressed context
- **security-audit plugin** -- more general-purpose
  - Web application security testing
  - Binary analysis toolchain integration
  - Forensics toolkit

## Library Mapping

| Extractable Process | Library Status | Action | Existing Path | Target Placement |
|-------------------|----------------|--------|---------------|------------------|
| CTF Challenge Solving Orchestration | NEW | Challenge analysis, classification, delegation to specialists, and writeup generation | - | specializations/security-compliance/ctf-challenge-solving.js |
| Web Security Audit Workflow | NEW | Systematic web vulnerability scanning with SQLi, XSS, SSTI, SSRF coverage | - | specializations/security-compliance/web-security-audit.js |
| Binary Analysis Workflow | NEW | Reverse engineering pipeline with anti-debug detection and symbolic execution | - | specializations/security-compliance/binary-analysis.js |
| Forensics Investigation Process | NEW | Disk/memory forensics, steganography, and network capture analysis workflow | - | specializations/security-compliance/forensics-investigation.js |
| Cryptographic Attack Methodology | NEW | RSA, AES, ECC attack patterns with lattice and PRNG analysis | - | specializations/security-compliance/cryptographic-attack-methodology.js |
| OSINT Investigation Process | NEW | Geolocation, social media, and DNS reconnaissance methodology | - | specializations/security-compliance/osint-investigation.js |

## Plugin Marketplace Mapping

| Plugin Idea | Marketplace Status | Action | Existing Plugin | Target Placement |
|-------------|-------------------|--------|-----------------|------------------|
| CTF Security Toolkit | NEW | Comprehensive CTF toolchain with challenge solving orchestration | - | plugins/a5c/marketplace/blueprints/ctf-security-toolkit/ |
| Binary Analysis Suite | UPGRADE | Enhanced binary analysis with reverse engineering and symbolic execution tools | basic-security | plugins/a5c/marketplace/blueprints/binary-analysis-suite/ |

### SKIP
- Individual technique encyclopedias (these are reference knowledge, not processes)
- Tool installation scripts (environment setup, not orchestration)
