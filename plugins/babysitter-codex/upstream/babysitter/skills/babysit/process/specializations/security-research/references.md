# Security Research and Vulnerability Analysis - References

This document provides curated references for security research, vulnerability analysis, penetration testing, reverse engineering, and exploit development practices.

## Vulnerability Research Fundamentals

### OWASP (Open Web Application Security Project)

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
  - Standard awareness document for most critical web application security risks
  - Covers injection, broken access control, cryptographic failures, and more

- **OWASP Web Security Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/
  - Comprehensive guide for web application penetration testing
  - Detailed testing methodologies for each vulnerability class

- **OWASP API Security Top 10**: https://owasp.org/www-project-api-security/
  - Top security risks specific to APIs
  - Testing strategies for API vulnerabilities

- **OWASP Mobile Security Testing Guide**: https://owasp.org/www-project-mobile-security-testing-guide/
  - Comprehensive manual for mobile app security testing
  - Covers iOS and Android platforms

- **OWASP Code Review Guide**: https://owasp.org/www-project-code-review-guide/
  - Security-focused code review methodology
  - Language-specific secure coding guidance

### CWE (Common Weakness Enumeration)

- **CWE Top 25 Most Dangerous Software Weaknesses**: https://cwe.mitre.org/top25/
  - Most dangerous and prevalent software weaknesses
  - Updated annually with industry data

- **CWE Full List**: https://cwe.mitre.org/data/index.html
  - Comprehensive enumeration of software weakness types
  - Detailed descriptions, examples, and mitigations

### CVE and Vulnerability Databases

- **CVE (Common Vulnerabilities and Exposures)**: https://cve.mitre.org/
  - Dictionary of publicly known vulnerabilities
  - Standard identifier format for vulnerabilities

- **NVD (National Vulnerability Database)**: https://nvd.nist.gov/
  - US government vulnerability repository
  - CVSS scoring and analysis

- **CVSS (Common Vulnerability Scoring System)**: https://www.first.org/cvss/
  - Standard for assessing vulnerability severity
  - Calculator and specification documents

- **EPSS (Exploit Prediction Scoring System)**: https://www.first.org/epss/
  - Predicts likelihood of exploitation
  - Data-driven vulnerability prioritization

- **VulnDB**: https://vulndb.cyberriskanalytics.com/
  - Commercial vulnerability intelligence database
  - Extended vulnerability coverage

- **Exploit-DB**: https://www.exploit-db.com/
  - Archive of public exploits and vulnerable software
  - Searchable database of proof-of-concepts

## Penetration Testing

### Methodologies and Frameworks

- **PTES (Penetration Testing Execution Standard)**: http://www.pentest-standard.org/
  - Industry standard for penetration testing methodology
  - Covers pre-engagement through reporting

- **OSSTMM (Open Source Security Testing Methodology Manual)**: https://www.isecom.org/OSSTMM.3.pdf
  - Peer-reviewed methodology for security testing
  - Includes metrics for measuring security

- **NIST SP 800-115**: https://csrc.nist.gov/publications/detail/sp/800-115/final
  - Technical Guide to Information Security Testing
  - US government testing guidelines

- **CREST Penetration Testing Guide**: https://www.crest-approved.org/
  - Industry certifications and testing standards
  - Professional penetration testing guidance

### Penetration Testing Tools

- **Metasploit Framework**: https://www.metasploit.com/
  - Open source exploitation framework
  - Extensive module library

- **Burp Suite**: https://portswigger.net/burp
  - Web application security testing platform
  - Industry standard for web testing

- **OWASP ZAP**: https://www.zaproxy.org/
  - Free and open source web scanner
  - Active and passive scanning capabilities

- **Nmap**: https://nmap.org/
  - Network discovery and security auditing
  - Scripting engine for custom checks

- **Nuclei**: https://nuclei.projectdiscovery.io/
  - Fast vulnerability scanner
  - Template-based detection

- **sqlmap**: https://sqlmap.org/
  - Automatic SQL injection detection and exploitation
  - Database takeover capabilities

- **Cobalt Strike**: https://www.cobaltstrike.com/
  - Adversary simulation platform
  - Red team operations toolkit

### Network Penetration Testing

- **Impacket**: https://github.com/fortra/impacket
  - Python classes for working with network protocols
  - Active Directory attack tools

- **Responder**: https://github.com/lgandx/Responder
  - LLMNR/NBT-NS/MDNS poisoner
  - Credential capture tool

- **CrackMapExec**: https://github.com/Porchetta-Industries/CrackMapExec
  - Post-exploitation tool for Active Directory
  - Swiss army knife for Windows/AD pentesting

- **BloodHound**: https://github.com/BloodHoundAD/BloodHound
  - Active Directory attack path analysis
  - Graph-based AD security mapping

## Reverse Engineering

### Disassemblers and Decompilers

- **IDA Pro**: https://hex-rays.com/ida-pro/
  - Industry standard disassembler
  - Hex-Rays decompiler integration

- **Ghidra**: https://ghidra-sre.org/
  - NSA's open source reverse engineering framework
  - Free decompiler and analysis tools

- **Binary Ninja**: https://binary.ninja/
  - Modern reverse engineering platform
  - Intermediate language for analysis

- **Radare2**: https://rada.re/n/
  - Open source reverse engineering framework
  - Command-line focused analysis

- **Cutter**: https://cutter.re/
  - Graphical frontend for Radare2
  - User-friendly RE interface

### Debugging Tools

- **GDB (GNU Debugger)**: https://www.gnu.org/software/gdb/
  - Standard debugger for Unix-like systems
  - Python scripting support

- **GEF (GDB Enhanced Features)**: https://github.com/hugsy/gef
  - GDB extension for exploit development
  - Enhanced visualization and commands

- **pwndbg**: https://github.com/pwndbg/pwndbg
  - GDB plugin for exploit developers
  - Heap analysis and visualization

- **WinDbg**: https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/
  - Windows debugger
  - Kernel and user-mode debugging

- **x64dbg**: https://x64dbg.com/
  - Open source Windows debugger
  - Modern UI for binary analysis

- **LLDB**: https://lldb.llvm.org/
  - LLVM project debugger
  - macOS and iOS debugging

### Binary Analysis Frameworks

- **angr**: https://angr.io/
  - Platform-agnostic binary analysis framework
  - Symbolic execution engine

- **Triton**: https://triton-library.github.io/
  - Dynamic binary analysis library
  - Symbolic execution and taint analysis

- **QEMU**: https://www.qemu.org/
  - Open source machine emulator
  - Cross-platform binary execution

- **Unicorn Engine**: https://www.unicorn-engine.org/
  - Lightweight CPU emulator framework
  - Based on QEMU

### Malware Analysis

- **YARA**: https://virustotal.github.io/yara/
  - Pattern matching tool for malware researchers
  - Rule-based malware identification

- **Cuckoo Sandbox**: https://cuckoosandbox.org/
  - Automated malware analysis system
  - Behavioral analysis reporting

- **REMnux**: https://remnux.org/
  - Linux toolkit for malware analysis
  - Pre-configured analysis environment

- **FLARE VM**: https://github.com/mandiant/flare-vm
  - Windows-based malware analysis distribution
  - Mandiant's RE toolkit

## Fuzzing and Dynamic Analysis

### Fuzzing Frameworks

- **AFL++ (American Fuzzy Lop++)**: https://aflplus.plus/
  - Coverage-guided fuzzing framework
  - Industry standard for fuzzing

- **libFuzzer**: https://llvm.org/docs/LibFuzzer.html
  - In-process, coverage-guided fuzzing
  - LLVM integrated fuzzer

- **honggfuzz**: https://github.com/google/honggfuzz
  - Security-oriented fuzzer
  - Supports multiple feedback methods

- **OSS-Fuzz**: https://github.com/google/oss-fuzz
  - Continuous fuzzing for open source software
  - Google's fuzzing infrastructure

- **Boofuzz**: https://github.com/jtpereyda/boofuzz
  - Network protocol fuzzing framework
  - Successor to Sulley

- **syzkaller**: https://github.com/google/syzkaller
  - Kernel fuzzer
  - Linux, Windows, and other OS support

### Sanitizers and Instrumentation

- **AddressSanitizer (ASAN)**: https://clang.llvm.org/docs/AddressSanitizer.html
  - Fast memory error detector
  - Detects buffer overflows, use-after-free

- **MemorySanitizer (MSAN)**: https://clang.llvm.org/docs/MemorySanitizer.html
  - Uninitialized memory read detector
  - Finds information leaks

- **UndefinedBehaviorSanitizer (UBSAN)**: https://clang.llvm.org/docs/UndefinedBehaviorSanitizer.html
  - Detects undefined behavior
  - Integer overflows, type confusion

- **ThreadSanitizer (TSAN)**: https://clang.llvm.org/docs/ThreadSanitizer.html
  - Data race detector
  - Concurrency bug finder

- **DynamoRIO**: https://dynamorio.org/
  - Dynamic binary instrumentation framework
  - Code coverage and analysis tools

- **Intel PIN**: https://www.intel.com/content/www/us/en/developer/articles/tool/pin-a-dynamic-binary-instrumentation-tool.html
  - Dynamic binary instrumentation tool
  - Intel's DBI framework

## Exploit Development

### Learning Resources

- **Nightmare**: https://guyinatuxedo.github.io/
  - Intro to binary exploitation and reverse engineering
  - CTF-based learning approach

- **pwn.college**: https://pwn.college/
  - Education platform for cybersecurity
  - Binary exploitation courses

- **ROP Emporium**: https://ropemporium.com/
  - Learn return-oriented programming
  - Challenge-based ROP learning

- **Exploit Education**: https://exploit.education/
  - Vulnerable VMs for learning
  - Phoenix, Protostar challenges

- **LiveOverflow**: https://liveoverflow.com/
  - Security research and CTF tutorials
  - YouTube video series

### Exploitation Tools

- **pwntools**: https://docs.pwntools.com/
  - CTF framework and exploit development library
  - Python library for exploit writing

- **ROPgadget**: https://github.com/JonathanSalwan/ROPgadget
  - ROP gadget finder
  - Multi-architecture support

- **ropper**: https://github.com/sashs/Ropper
  - Find ROP gadgets in binaries
  - Automated ROP chain generation

- **one_gadget**: https://github.com/david942j/one_gadget
  - Find one-gadget RCE in libc
  - Automatic constraint solving

- **Shellcode Resources**: http://shell-storm.org/shellcode/
  - Shellcode database
  - Multi-platform shellcode

### Modern Exploitation Research

- **Project Zero**: https://googleprojectzero.blogspot.com/
  - Google's security research team blog
  - High-quality vulnerability research

- **Azeria Labs ARM Exploitation**: https://azeria-labs.com/
  - ARM assembly and exploitation tutorials
  - ARM-specific security research

## Bug Bounty Programs

### Bug Bounty Platforms

- **HackerOne**: https://www.hackerone.com/
  - Leading bug bounty platform
  - Extensive program directory

- **Bugcrowd**: https://www.bugcrowd.com/
  - Crowdsourced security platform
  - Bug bounty and VDP programs

- **Intigriti**: https://www.intigriti.com/
  - European bug bounty platform
  - Researcher community focus

- **YesWeHack**: https://www.yeswehack.com/
  - Global bug bounty platform
  - European-based platform

- **Synack**: https://www.synack.com/
  - Crowdsourced security testing
  - Vetted researcher community

### Bug Bounty Resources

- **Bug Bounty Forum**: https://bugbountyforum.com/
  - Community forum for bug bounty hunters
  - Tips and resources

- **HackerOne Hacktivity**: https://hackerone.com/hacktivity
  - Public bug bounty disclosures
  - Learning from real vulnerabilities

- **Pentester Land**: https://pentester.land/
  - Bug bounty writeups compilation
  - Weekly newsletter

- **Bug Bounty Hunting Essentials** (Book): https://www.packtpub.com/product/bug-bounty-hunting-essentials/9781788626897
  - Comprehensive bug bounty guide
  - Methodology and techniques

## Responsible Disclosure

### Disclosure Guidelines

- **ISO/IEC 29147**: https://www.iso.org/standard/72311.html
  - Vulnerability disclosure standard
  - Vendor-side disclosure guidance

- **ISO/IEC 30111**: https://www.iso.org/standard/69725.html
  - Vulnerability handling processes
  - Organizational vulnerability management

- **CERT/CC Vulnerability Disclosure Policy**: https://vuls.cert.org/confluence/display/CVD/
  - Coordinated vulnerability disclosure guidance
  - 45-day disclosure timeline

- **Google Project Zero Disclosure Policy**: https://googleprojectzero.blogspot.com/p/vulnerability-disclosure-policy.html
  - 90-day disclosure policy
  - Industry-influential approach

### CVE Process

- **CVE Program**: https://www.cve.org/
  - Official CVE program website
  - CVE assignment process

- **CVE Numbering Authorities (CNAs)**: https://www.cve.org/PartnerInformation/ListofPartners
  - Organizations that assign CVEs
  - CNA program information

- **MITRE CVE**: https://cve.mitre.org/
  - CVE dictionary and search
  - Historical CVE data

## Security Research Publications

### Academic Venues

- **IEEE S&P (Oakland)**: https://www.ieee-security.org/TC/SP-Index.html
  - Premier security conference
  - Top-tier academic research

- **USENIX Security**: https://www.usenix.org/conferences
  - Major security symposium
  - Practical security research

- **CCS (ACM Conference on Computer and Communications Security)**: https://www.sigsac.org/ccs/
  - ACM's flagship security conference
  - Broad security research

- **NDSS (Network and Distributed System Security)**: https://www.ndss-symposium.org/
  - Internet security research
  - Network security focus

### Industry Conferences

- **DEF CON**: https://defcon.org/
  - Largest hacker convention
  - Talks, villages, and CTF

- **Black Hat**: https://www.blackhat.com/
  - Professional security conference
  - Trainings and briefings

- **CanSecWest**: https://cansecwest.com/
  - Vancouver security conference
  - Pwn2Own contest

- **REcon**: https://recon.cx/
  - Reverse engineering conference
  - RE-focused presentations

### Research Blogs and Publications

- **Google Project Zero Blog**: https://googleprojectzero.blogspot.com/
  - High-quality vulnerability research
  - Detailed technical analysis

- **Exodus Intelligence Blog**: https://blog.exodusintel.com/
  - Advanced vulnerability research
  - Exploit development

- **Trail of Bits Blog**: https://blog.trailofbits.com/
  - Security research and tooling
  - Blockchain and systems security

- **NCC Group Research**: https://research.nccgroup.com/
  - Security research publications
  - Diverse security topics

- **Mandiant Blog**: https://www.mandiant.com/resources/blog
  - Threat intelligence and research
  - APT research and analysis

## Security Tools and Frameworks

### Reconnaissance Tools

- **Amass**: https://github.com/OWASP/Amass
  - Network mapping and attack surface discovery
  - DNS enumeration

- **Subfinder**: https://github.com/projectdiscovery/subfinder
  - Subdomain discovery tool
  - Multiple data sources

- **httpx**: https://github.com/projectdiscovery/httpx
  - Fast HTTP probing toolkit
  - Technology fingerprinting

- **Shodan**: https://www.shodan.io/
  - Search engine for Internet-connected devices
  - Vulnerability discovery

- **Censys**: https://censys.io/
  - Internet-wide scanning database
  - Certificate and host data

### Network Analysis

- **Wireshark**: https://www.wireshark.org/
  - Network protocol analyzer
  - Packet capture and analysis

- **tcpdump**: https://www.tcpdump.org/
  - Command-line packet analyzer
  - Network debugging

- **Scapy**: https://scapy.net/
  - Packet manipulation library
  - Protocol analysis and crafting

- **mitmproxy**: https://mitmproxy.org/
  - Interactive HTTPS proxy
  - Traffic inspection and modification

### Cryptography Analysis

- **CyberChef**: https://gchq.github.io/CyberChef/
  - Data analysis web app
  - Encoding/decoding/crypto operations

- **Hashcat**: https://hashcat.net/hashcat/
  - Password recovery tool
  - GPU-accelerated cracking

- **John the Ripper**: https://www.openwall.com/john/
  - Password cracker
  - Multiple hash format support

## Training and Certifications

### Certifications

- **OSCP (Offensive Security Certified Professional)**: https://www.offensive-security.com/pwk-oscp/
  - Hands-on penetration testing certification
  - Industry-recognized credential

- **OSWE (Offensive Security Web Expert)**: https://www.offensive-security.com/awae-oswe/
  - Advanced web application security
  - White-box testing focus

- **OSED (Offensive Security Exploit Developer)**: https://www.offensive-security.com/exp301-osed/
  - Windows exploitation certification
  - Modern exploit development

- **OSEE (Offensive Security Exploitation Expert)**: https://www.offensive-security.com/awe-osee/
  - Advanced Windows exploitation
  - Expert-level certification

- **GPEN (GIAC Penetration Tester)**: https://www.giac.org/certifications/penetration-tester-gpen/
  - SANS penetration testing certification
  - Methodology-focused

- **GXPN (GIAC Exploit Researcher and Advanced Penetration Tester)**: https://www.giac.org/certifications/exploit-researcher-advanced-penetration-tester-gxpn/
  - Advanced exploitation certification
  - Research and development focus

### Training Platforms

- **Offensive Security Training**: https://www.offensive-security.com/
  - Penetration testing courses
  - Try Harder methodology

- **SANS Institute**: https://www.sans.org/
  - Professional security training
  - Comprehensive curriculum

- **PentesterLab**: https://pentesterlab.com/
  - Hands-on web security training
  - Progressive exercises

- **Hack The Box**: https://www.hackthebox.com/
  - Penetration testing labs
  - CTF-style challenges

- **TryHackMe**: https://tryhackme.com/
  - Guided cybersecurity training
  - Beginner-friendly platform

- **VulnHub**: https://www.vulnhub.com/
  - Vulnerable VMs for practice
  - Local lab environment

## Community Resources

### Forums and Communities

- **Reddit r/netsec**: https://www.reddit.com/r/netsec/
  - Information security news and discussion
  - Research sharing

- **Reddit r/ReverseEngineering**: https://www.reddit.com/r/ReverseEngineering/
  - RE discussion and resources
  - Tool announcements

- **Reddit r/Malware**: https://www.reddit.com/r/Malware/
  - Malware analysis discussion
  - Sample sharing

- **0x00sec**: https://0x00sec.org/
  - Security research community
  - Tutorials and discussions

- **Security Stack Exchange**: https://security.stackexchange.com/
  - Q&A for security professionals
  - Technical security questions

### Newsletters and News

- **Risky Business**: https://risky.biz/
  - Security news podcast
  - Industry analysis

- **tl;dr sec**: https://tldrsec.com/
  - Weekly security newsletter
  - Curated security content

- **This Week in Security**: https://this.weekinsecurity.com/
  - Weekly security roundup
  - Vulnerability highlights

- **Krebs on Security**: https://krebsonsecurity.com/
  - Investigative security journalism
  - In-depth breach coverage

### CTF Resources

- **CTFtime**: https://ctftime.org/
  - CTF competition calendar
  - Team rankings and writeups

- **picoCTF**: https://picoctf.org/
  - Beginner-friendly CTF
  - Educational challenges

- **CTF101**: https://ctf101.org/
  - CTF learning resource
  - Category explanations

## Legal and Ethical Resources

### Legal Frameworks

- **CFAA (Computer Fraud and Abuse Act)**: https://www.law.cornell.edu/uscode/text/18/1030
  - US computer crime law
  - Authorization requirements

- **UK Computer Misuse Act**: https://www.legislation.gov.uk/ukpga/1990/18/contents
  - UK computer crime legislation
  - Unauthorized access laws

- **GDPR (Article 32-34)**: https://gdpr-info.eu/
  - Security and breach notification requirements
  - EU data protection

### Ethical Guidelines

- **EC-Council Code of Ethics**: https://www.eccouncil.org/code-of-ethics/
  - Ethical hacking code of conduct
  - Professional standards

- **CREST Code of Conduct**: https://www.crest-approved.org/
  - Penetration testing ethics
  - Professional guidelines

- **ISC2 Code of Ethics**: https://www.isc2.org/Ethics
  - Information security ethics
  - Professional conduct standards

## Additional Resources

### Books

- **The Web Application Hacker's Handbook** by Dafydd Stuttard and Marcus Pinto
  - Comprehensive web security testing guide

- **Hacking: The Art of Exploitation** by Jon Erickson
  - Classic binary exploitation book

- **Practical Malware Analysis** by Michael Sikorski and Andrew Honig
  - Malware analysis methodology

- **The Shellcoder's Handbook** by Chris Anley et al.
  - Exploit development techniques

- **Reversing: Secrets of Reverse Engineering** by Eldad Eilam
  - RE fundamentals and techniques

### GitHub Collections

- **Awesome Security**: https://github.com/sbilly/awesome-security
  - Curated security resources

- **Awesome Hacking**: https://github.com/Hack-with-Github/Awesome-Hacking
  - Hacking resources collection

- **Awesome Pentest**: https://github.com/enaqx/awesome-pentest
  - Penetration testing resources

- **Awesome Reverse Engineering**: https://github.com/tylerha97/awesome-reversing
  - RE resources and tools

- **PayloadsAllTheThings**: https://github.com/swisskyrepo/PayloadsAllTheThings
  - Useful payloads and bypass techniques
