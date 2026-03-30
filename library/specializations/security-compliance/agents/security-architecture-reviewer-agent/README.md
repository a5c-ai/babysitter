# Security Architecture Reviewer Agent

AI-assisted security architecture analysis agent for identifying security gaps, evaluating defense-in-depth, and generating improvement recommendations.

## Overview

This agent analyzes system architectures to identify security weaknesses, evaluate defense-in-depth implementations, assess zero trust alignment, and provide prioritized recommendations for security improvements aligned with industry frameworks.

## Expertise Areas

- Security architecture review
- Defense-in-depth design evaluation
- Zero trust architecture assessment
- Cloud security architecture
- Threat modeling integration
- Security control design

## Key Capabilities

- **Architecture Analysis**: Review diagrams, identify trust zones, analyze data flows
- **Gap Identification**: Find missing controls, architectural weaknesses, compliance gaps
- **Defense-in-Depth**: Evaluate layered security controls across all tiers
- **Zero Trust Assessment**: Assess identity, device trust, micro-segmentation
- **Compliance Mapping**: Align architecture to regulatory requirements
- **Recommendations**: Provide prioritized, actionable improvements

## Context Requirements

| Input | Description |
|-------|-------------|
| Architecture Diagrams | Network, component, data flow diagrams |
| Security Requirements | Compliance needs, policies, risk tolerance |
| Deployment Topology | Cloud, on-prem, hybrid configurations |
| Data Classification | Data types and sensitivity levels |
| Threat Context | Known threats and risk assessments |

## Analysis Frameworks

- NIST Cybersecurity Framework
- SABSA Security Architecture
- Zero Trust Principles
- Cloud Security Alliance (CSA)
- OWASP Security Architecture

## Output

The agent produces structured findings including:
- Security gap analysis
- Defense-in-depth evaluation
- Zero trust maturity assessment
- Compliance gap mapping
- Prioritized recommendations with effort estimates

## Usage

```javascript
agent: {
  name: 'security-architecture-reviewer-agent',
  prompt: {
    task: 'Review microservices architecture for security gaps',
    context: {
      architectureDocs: './docs/architecture',
      complianceScope: ['SOC2', 'PCI-DSS']
    }
  }
}
```

## Related Components

- **Processes**: Cloud Security Architecture Review, Security Risk Assessment
- **Collaborates With**: threat-modeling-agent, risk-scoring-agent
