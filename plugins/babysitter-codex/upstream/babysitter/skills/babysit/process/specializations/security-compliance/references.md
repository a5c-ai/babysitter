# Security, Compliance, and Risk Management - References

This document provides curated references for security, compliance, and risk management practices in software development and operations.

## Security Frameworks and Standards

### OWASP (Open Web Application Security Project)

- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
  - The standard awareness document for developers and web application security
  - Represents a broad consensus about the most critical security risks to web applications
  - Latest version covers: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable Components, Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, Server-Side Request Forgery

- **OWASP Application Security Verification Standard (ASVS)**: https://owasp.org/www-project-application-security-verification-standard/
  - Framework of security requirements and controls to help organizations develop and maintain secure applications

- **OWASP Software Assurance Maturity Model (SAMM)**: https://owaspsamm.org/
  - Open framework to help organizations formulate and implement a strategy for software security

- **OWASP API Security Top 10**: https://owasp.org/www-project-api-security/
  - Focuses on strategies and solutions to understand and mitigate the unique vulnerabilities and security risks of APIs

### NIST (National Institute of Standards and Technology)

- **NIST Cybersecurity Framework (CSF)**: https://www.nist.gov/cyberframework
  - Voluntary framework consisting of standards, guidelines, and best practices to manage cybersecurity-related risk
  - Five core functions: Identify, Protect, Detect, Respond, Recover

- **NIST SP 800-53**: https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
  - Security and Privacy Controls for Information Systems and Organizations
  - Comprehensive catalog of security and privacy controls

- **NIST SP 800-37**: https://csrc.nist.gov/publications/detail/sp/800-37/rev-2/final
  - Risk Management Framework for Information Systems and Organizations
  - Provides guidelines for applying the Risk Management Framework to information systems

- **NIST SP 800-64**: https://csrc.nist.gov/publications/detail/sp/800-64/rev-2/final
  - Security Considerations in the System Development Life Cycle

### ISO/IEC Standards

- **ISO/IEC 27001**: https://www.iso.org/standard/27001
  - International standard for information security management systems (ISMS)
  - Provides requirements for establishing, implementing, maintaining and continually improving an ISMS

- **ISO/IEC 27002**: https://www.iso.org/standard/75652.html
  - Code of practice for information security controls
  - Provides guidance on implementing information security controls

- **ISO/IEC 27017**: https://www.iso.org/standard/43757.html
  - Code of practice for information security controls based on ISO/IEC 27002 for cloud services

- **ISO/IEC 27018**: https://www.iso.org/standard/76559.html
  - Code of practice for protection of personally identifiable information (PII) in public clouds

## Compliance Standards and Regulations

### GDPR (General Data Protection Regulation)

- **Official GDPR Text**: https://gdpr-info.eu/
  - EU regulation on data protection and privacy
  - Applies to all companies processing and holding personal data of EU citizens

- **GDPR Developer Guide**: https://github.com/LINCnil/GDPR-Developer-Guide
  - Practical guide for developers to comply with GDPR

### HIPAA (Health Insurance Portability and Accountability Act)

- **HIPAA Security Rule**: https://www.hhs.gov/hipaa/for-professionals/security/index.html
  - US regulation for protecting electronic protected health information (ePHI)
  - Requires appropriate administrative, physical and technical safeguards

- **HIPAA Privacy Rule**: https://www.hhs.gov/hipaa/for-professionals/privacy/index.html
  - Standards for protecting individually identifiable health information

### SOC 2 (Service Organization Control 2)

- **AICPA SOC 2**: https://www.aicpa.org/interestareas/frc/assuranceadvisoryservices/aicpasoc2report.html
  - Auditing standard for service organizations that store customer data
  - Based on Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy

- **SOC 2 Compliance Guide**: https://www.vanta.com/resources/soc-2-compliance-guide
  - Practical guide for achieving SOC 2 compliance

### PCI DSS (Payment Card Industry Data Security Standard)

- **PCI Security Standards**: https://www.pcisecuritystandards.org/
  - Set of security standards designed to ensure that all companies that accept, process, store or transmit credit card information maintain a secure environment

### Other Compliance Frameworks

- **CCPA (California Consumer Privacy Act)**: https://oag.ca.gov/privacy/ccpa
  - California data privacy law

- **FedRAMP (Federal Risk and Authorization Management Program)**: https://www.fedramp.gov/
  - US government-wide program for security assessment, authorization, and monitoring of cloud products and services

## Threat Modeling

### STRIDE Threat Model

- **STRIDE Methodology**: https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats
  - Microsoft's threat classification scheme
  - Categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege

- **Threat Modeling Manifesto**: https://www.threatmodelingmanifesto.org/
  - Values and principles for threat modeling

- **OWASP Threat Modeling**: https://owasp.org/www-community/Threat_Modeling
  - Comprehensive guide to threat modeling process

### Additional Threat Modeling Frameworks

- **PASTA (Process for Attack Simulation and Threat Analysis)**: https://owasp.org/www-pdf-archive/AppSecEU2012_PASTA.pdf
  - Risk-centric threat modeling framework

- **VAST (Visual, Agile, and Simple Threat modeling)**: https://www.threatmodeler.com/threat-modeling-methodologies-vast/
  - Scalable threat modeling approach for agile environments

- **Attack Trees**: https://www.schneier.com/academic/archives/1999/12/attack_trees.html
  - Formal way of describing security attacks

## Penetration Testing

### General Penetration Testing Resources

- **OWASP Testing Guide**: https://owasp.org/www-project-web-security-testing-guide/
  - Comprehensive guide for web application penetration testing and security testing

- **PTES (Penetration Testing Execution Standard)**: http://www.pentest-standard.org/
  - Standard for conducting penetration tests

- **NIST SP 800-115**: https://csrc.nist.gov/publications/detail/sp/800-115/final
  - Technical Guide to Information Security Testing and Assessment

### Penetration Testing Methodologies

- **OSSTMM (Open Source Security Testing Methodology Manual)**: https://www.isecom.org/OSSTMM.3.pdf
  - Peer-reviewed methodology for performing security tests and metrics

- **ISSAF (Information Systems Security Assessment Framework)**: http://www.oissg.org/issaf
  - Structured approach to penetration testing

## Security Scanning Tools

### Static Application Security Testing (SAST)

- **SonarQube**: https://www.sonarqube.org/
  - Continuous inspection of code quality and security vulnerabilities

- **Semgrep**: https://semgrep.dev/
  - Fast, open-source static analysis tool

- **Bandit (Python)**: https://bandit.readthedocs.io/
  - Tool designed to find common security issues in Python code

- **ESLint with security plugins**: https://github.com/nodesecurity/eslint-plugin-security
  - JavaScript/TypeScript security linting

- **Brakeman (Ruby)**: https://brakemanscanner.org/
  - Static analysis security scanner for Ruby on Rails

### Dynamic Application Security Testing (DAST)

- **OWASP ZAP (Zed Attack Proxy)**: https://www.zaproxy.org/
  - Free security testing tool for finding vulnerabilities in web applications

- **Burp Suite**: https://portswigger.net/burp
  - Platform for security testing of web applications

- **Nuclei**: https://nuclei.projectdiscovery.io/
  - Fast and customizable vulnerability scanner

### Software Composition Analysis (SCA)

- **Dependabot**: https://github.com/dependabot
  - Automated dependency updates and security vulnerability alerts

- **Snyk**: https://snyk.io/
  - Developer security platform for finding and fixing vulnerabilities in dependencies

- **OWASP Dependency-Check**: https://owasp.org/www-project-dependency-check/
  - Software composition analysis tool that identifies known vulnerabilities in project dependencies

- **Trivy**: https://trivy.dev/
  - Comprehensive security scanner for containers and other artifacts

### Container and Infrastructure Security

- **Clair**: https://github.com/quay/clair
  - Vulnerability static analysis for containers

- **Anchore**: https://anchore.com/opensource/
  - Container analysis and inspection platform

- **Falco**: https://falco.org/
  - Cloud native runtime security tool for threat detection

- **kube-bench**: https://github.com/aquasecurity/kube-bench
  - Checks whether Kubernetes is deployed according to security best practices

### Interactive Application Security Testing (IAST)

- **Contrast Security**: https://www.contrastsecurity.com/
  - IAST solution that instruments applications to detect vulnerabilities

### Security Orchestration and Automation

- **OWASP DefectDojo**: https://www.defectdojo.org/
  - Security orchestration and vulnerability management platform

- **Faraday**: https://faradaysec.com/
  - Collaborative penetration test and vulnerability management platform

## Secure Software Development Lifecycle (SSDLC)

### SSDLC Frameworks

- **Microsoft Security Development Lifecycle (SDL)**: https://www.microsoft.com/en-us/securityengineering/sdl
  - Security assurance process focused on software development

- **NIST SSDF (Secure Software Development Framework)**: https://csrc.nist.gov/publications/detail/sp/800-218/final
  - Framework for secure software development practices

- **BSIMM (Building Security In Maturity Model)**: https://www.bsimm.com/
  - Study of real-world software security initiatives

- **SAFECode**: https://safecode.org/
  - Global industry forum focused on software security

### DevSecOps

- **DevSecOps Manifesto**: https://www.devsecops.org/
  - Principles and practices for integrating security into DevOps

- **OWASP DevSecOps Guideline**: https://owasp.org/www-project-devsecops-guideline/
  - Guidelines for implementing DevSecOps practices

## Vulnerability Management

### Vulnerability Databases

- **CVE (Common Vulnerabilities and Exposures)**: https://cve.mitre.org/
  - Dictionary of publicly known information security vulnerabilities

- **NVD (National Vulnerability Database)**: https://nvd.nist.gov/
  - US government repository of standards-based vulnerability management data

- **CWE (Common Weakness Enumeration)**: https://cwe.mitre.org/
  - Community-developed list of software and hardware weakness types

### Vulnerability Scoring

- **CVSS (Common Vulnerability Scoring System)**: https://www.first.org/cvss/
  - Standard for assessing severity of security vulnerabilities

- **EPSS (Exploit Prediction Scoring System)**: https://www.first.org/epss/
  - Data-driven effort for estimating likelihood of software vulnerabilities being exploited

## Incident Response

### Incident Response Frameworks

- **NIST SP 800-61**: https://csrc.nist.gov/publications/detail/sp/800-61/rev-2/final
  - Computer Security Incident Handling Guide

- **SANS Incident Response Process**: https://www.sans.org/white-papers/33901/
  - Six-phase incident response process: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned

- **CERT Incident Management Framework**: https://www.cert.org/incident-management/
  - Framework for managing cybersecurity incidents

### Incident Response Tools

- **TheHive**: https://thehive-project.org/
  - Scalable security incident response platform

- **MISP (Malware Information Sharing Platform)**: https://www.misp-project.org/
  - Open source threat intelligence and sharing platform

## Security Best Practices and Principles

### Security Principles

- **Principle of Least Privilege**: https://csrc.nist.gov/glossary/term/least_privilege
  - Users and systems should have minimum access necessary to perform their functions

- **Defense in Depth**: https://csrc.nist.gov/glossary/term/defense_in_depth
  - Information security strategy integrating people, technology, and operations capabilities

- **Zero Trust Architecture**: https://www.nist.gov/publications/zero-trust-architecture
  - NIST SP 800-207 - Security model that assumes breach and verifies each request

- **Secure by Design**: https://www.ncsc.gov.uk/collection/secure-by-design
  - Approach where security is built into technology from the start

### Cryptography and Key Management

- **NIST Cryptographic Standards**: https://csrc.nist.gov/projects/cryptographic-standards-and-guidelines
  - Standards for cryptographic algorithms and key management

- **TLS Best Practices**: https://wiki.mozilla.org/Security/Server_Side_TLS
  - Mozilla's recommendations for TLS configuration

- **Key Management Best Practices**: https://csrc.nist.gov/publications/detail/sp/800-57-part-1/rev-5/final
  - NIST recommendations for key management

### Authentication and Authorization

- **OAuth 2.0 Best Practices**: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics
  - Security best practices for OAuth 2.0

- **OIDC (OpenID Connect)**: https://openid.net/connect/
  - Identity layer on top of OAuth 2.0

- **WebAuthn**: https://www.w3.org/TR/webauthn/
  - Web standard for passwordless authentication

- **RBAC (Role-Based Access Control)**: https://csrc.nist.gov/projects/role-based-access-control
  - Access control approach based on roles

## Privacy and Data Protection

### Privacy Frameworks

- **Privacy by Design**: https://www.ipc.on.ca/wp-content/uploads/resources/7foundationalprinciples.pdf
  - Framework for embedding privacy into technology design

- **NIST Privacy Framework**: https://www.nist.gov/privacy-framework
  - Tool for improving privacy through enterprise risk management

### Data Classification and Handling

- **Data Classification Guide**: https://csrc.nist.gov/glossary/term/data_classification
  - NIST guidance on categorizing data based on sensitivity

- **Data Loss Prevention (DLP)**: https://www.sans.org/reading-room/whitepapers/dlp/data-loss-prevention-33414
  - Strategies for preventing data loss

## Cloud Security

### Cloud Security Frameworks

- **CSA Cloud Controls Matrix (CCM)**: https://cloudsecurityalliance.org/research/cloud-controls-matrix/
  - Cybersecurity control framework for cloud computing

- **CSA Security Guidance**: https://cloudsecurityalliance.org/research/guidance/
  - Best practices for secure cloud computing

- **AWS Security Best Practices**: https://aws.amazon.com/architecture/security-identity-compliance/
  - Security guidance for AWS cloud

- **Azure Security Best Practices**: https://learn.microsoft.com/en-us/azure/security/fundamentals/best-practices-and-patterns
  - Security guidance for Microsoft Azure

- **GCP Security Best Practices**: https://cloud.google.com/security/best-practices
  - Security guidance for Google Cloud Platform

## Security Training and Awareness

### Security Training Resources

- **OWASP Top 10 Training**: https://owasp.org/www-project-top-ten/
  - Training materials for OWASP Top 10

- **SANS Security Training**: https://www.sans.org/
  - Professional information security training and certification

- **Secure Code Warrior**: https://www.securecodewarrior.com/
  - Gamified secure coding training platform

### Security Certifications

- **CISSP (Certified Information Systems Security Professional)**: https://www.isc2.org/Certifications/CISSP
  - Premier security certification

- **CEH (Certified Ethical Hacker)**: https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/
  - Certification for ethical hacking skills

- **OSCP (Offensive Security Certified Professional)**: https://www.offensive-security.com/pwk-oscp/
  - Hands-on penetration testing certification

- **CSSLP (Certified Secure Software Lifecycle Professional)**: https://www.isc2.org/Certifications/CSSLP
  - Certification for secure software development

## Supply Chain Security

- **SLSA (Supply-chain Levels for Software Artifacts)**: https://slsa.dev/
  - Security framework for software supply chain integrity

- **SBOM (Software Bill of Materials)**: https://www.ntia.gov/sbom
  - Formal record containing details and supply chain relationships of components used in building software

- **Sigstore**: https://www.sigstore.dev/
  - New standard for signing, verifying and protecting software

## Additional Resources

### Security Research and News

- **Krebs on Security**: https://krebsonsecurity.com/
  - In-depth security news and investigation

- **The Hacker News**: https://thehackernews.com/
  - Cybersecurity news and updates

- **Schneier on Security**: https://www.schneier.com/
  - Blog by security expert Bruce Schneier

### Security Communities

- **OWASP Community**: https://owasp.org/
  - Open community for application security

- **SANS Internet Storm Center**: https://isc.sans.edu/
  - Cooperative network security monitoring platform

- **Security Stack Exchange**: https://security.stackexchange.com/
  - Q&A community for security professionals

### Security Tools Collections

- **OWASP Projects**: https://owasp.org/projects/
  - Comprehensive list of OWASP tools and resources

- **SecLists**: https://github.com/danielmiessler/SecLists
  - Collection of security testing lists

- **Awesome Security**: https://github.com/sbilly/awesome-security
  - Curated list of security resources and tools
