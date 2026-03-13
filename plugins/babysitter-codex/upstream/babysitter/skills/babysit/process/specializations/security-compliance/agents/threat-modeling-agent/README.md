# Threat Modeling Agent

## Overview

The `threat-modeling-agent` provides AI-assisted threat identification and risk analysis. It embodies the expertise of a Senior Security Architect for systematic threat modeling using STRIDE methodology, data flow analysis, risk assessment, and security control recommendations.

## Persona

| Attribute | Value |
|-----------|-------|
| **Role** | Senior Security Architect |
| **Experience** | 12+ years in threat modeling |
| **Background** | Microsoft SDL, STRIDE, PASTA |
| **Philosophy** | "Think like an attacker to build like a defender" |

## Core Principles

1. **Attacker Mindset** - Consider adversary perspective
2. **Systematic Analysis** - Use structured methodologies
3. **Risk-Based** - Prioritize by likelihood and impact
4. **Defense in Depth** - Layer security controls
5. **Continuous** - Evolve with the system

## Expertise Areas

| Area | Capabilities |
|------|--------------|
| **STRIDE Analysis** | All 6 threat categories |
| **DFD Analysis** | Elements, flows, boundaries |
| **Risk Assessment** | Likelihood, impact, scoring |
| **Control Mapping** | Mitigations for threats |
| **Standard Mapping** | CWE, CAPEC, ATT&CK |
| **Threat Tracking** | Status, mitigation progress |

## Usage

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(threatModelTask, {
  agentName: 'threat-modeling-agent',
  prompt: {
    role: 'Senior Security Architect',
    task: 'Create threat model for payment system',
    context: {
      systemDescription: 'E-commerce payment processing',
      architecture: await getArchitectureDocs(),
      dataFlows: await getDataFlowDiagram(),
      existingControls: await getSecurityControls()
    },
    instructions: [
      'Analyze data flow diagram',
      'Identify threats using STRIDE',
      'Assess risk for each threat',
      'Map to CWE/CAPEC/ATT&CK',
      'Recommend security controls',
      'Prioritize remediation'
    ],
    outputFormat: 'JSON'
  }
});
```

### Direct Invocation

```bash
# Create threat model from architecture
/agent threat-modeling-agent analyze \
  --architecture ./architecture.yaml \
  --scope "payment-processing"

# STRIDE analysis on specific component
/agent threat-modeling-agent stride \
  --component "api-gateway" \
  --dfd ./data-flow-diagram.yaml

# Risk assessment for identified threats
/agent threat-modeling-agent assess-risk \
  --threats ./threats.json \
  --asset-values ./assets.json

# Generate remediation plan
/agent threat-modeling-agent remediation-plan \
  --threat-model ./threat-model.json \
  --budget high
```

## Common Tasks

### 1. System Threat Model

```bash
/agent threat-modeling-agent create \
  --system "E-Commerce Platform" \
  --architecture ./arch-docs/ \
  --output ./threat-model.json
```

Output includes:
- Data flow diagram analysis
- Complete STRIDE threat list
- Risk-ranked threats
- Recommended controls
- Mitigation roadmap

### 2. Component Analysis

```bash
/agent threat-modeling-agent analyze-component \
  --component "Authentication Service" \
  --interfaces ./auth-api-spec.yaml \
  --data-classification ./data-types.yaml
```

Provides:
- Component-specific threats
- Interface vulnerabilities
- Data flow risks
- Control recommendations

### 3. Architecture Review

```bash
/agent threat-modeling-agent review-architecture \
  --current ./current-arch.yaml \
  --proposed ./proposed-changes.yaml \
  --focus security
```

Delivers:
- Security implications of changes
- New threats introduced
- Existing threats affected
- Required additional controls

### 4. Attack Tree Generation

```bash
/agent threat-modeling-agent attack-tree \
  --goal "Steal customer credit cards" \
  --system ./system-model.yaml \
  --depth 4
```

Generates:
- Attack tree diagram
- Attack paths analysis
- Difficulty assessment
- Control placement recommendations

## Process Integration

### Processes Using This Agent

| Process | Agent Role |
|---------|------------|
| `stride-threat-modeling.js` | Core threat identification |
| `security-risk-assessment.js` | Risk analysis |
| `secure-design-review.js` | Design security review |
| `architecture-review.js` | Architecture assessment |

### Task Definition Example

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const threatModelingTask = defineTask({
  name: 'threat-model',
  description: 'Create comprehensive threat model using STRIDE',

  async run(inputs, taskCtx) {
    return {
      kind: 'agent',
      title: `Threat model for ${inputs.systemName}`,
      agent: {
        name: 'threat-modeling-agent',
        prompt: {
          role: 'Senior Security Architect',
          task: 'Create comprehensive threat model',
          context: {
            systemName: inputs.systemName,
            architecture: inputs.architectureDoc,
            dataFlows: inputs.dataFlowDiagram,
            trustBoundaries: inputs.trustBoundaries,
            existingControls: inputs.securityControls
          },
          instructions: [
            'Analyze system architecture and data flows',
            'Identify all trust boundaries',
            'Apply STRIDE to each component and flow',
            'Assess risk (likelihood x impact)',
            'Map threats to CWE, CAPEC, MITRE ATT&CK',
            'Recommend security controls for each threat',
            'Prioritize by risk and feasibility',
            'Generate mitigation roadmap'
          ],
          outputFormat: 'JSON'
        },
        outputSchema: {
          type: 'object',
          required: ['threatModel', 'threats', 'recommendations'],
          properties: {
            threatModel: { type: 'object' },
            dataFlowDiagram: { type: 'object' },
            threats: { type: 'array' },
            summary: { type: 'object' },
            recommendations: { type: 'object' }
          }
        }
      },
      io: {
        inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
        outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
      }
    };
  }
});
```

## STRIDE Reference

| Category | Property | Question |
|----------|----------|----------|
| **Spoofing** | Authentication | Can someone pretend to be someone else? |
| **Tampering** | Integrity | Can data be modified? |
| **Repudiation** | Non-repudiation | Can actions be denied? |
| **Info Disclosure** | Confidentiality | Can data be exposed? |
| **Denial of Service** | Availability | Can service be disrupted? |
| **Elevation** | Authorization | Can privileges be gained? |

## Risk Assessment Matrix

### Likelihood Factors

| Factor | Low (1) | Medium (2) | High (3) | Critical (4) |
|--------|---------|------------|----------|--------------|
| Skill | Expert | Skilled | Intermediate | Novice |
| Motivation | None | Low | Moderate | High |
| Opportunity | Difficult | Limited | Somewhat | Easy |
| Exposure | Unknown | Limited | Researcher | Public |

### Impact Factors

| Factor | Low (1) | Medium (2) | High (3) | Critical (4) |
|--------|---------|------------|----------|--------------|
| Confidentiality | Minimal | Limited | Sensitive | Critical |
| Integrity | Minimal | Limited | Significant | Critical |
| Availability | Minimal | Limited | Significant | Complete |

### Risk Matrix

| | Impact Low | Impact Med | Impact High | Impact Crit |
|-|------------|------------|-------------|-------------|
| **Likelihood Crit** | Medium | High | Critical | Critical |
| **Likelihood High** | Low | Medium | High | Critical |
| **Likelihood Med** | Low | Medium | Medium | High |
| **Likelihood Low** | Low | Low | Medium | Medium |

## Data Flow Diagram Elements

| Element | Symbol | STRIDE Applicable |
|---------|--------|-------------------|
| External Entity | Rectangle | S, R |
| Process | Circle | S, T, R, I, D, E |
| Data Store | Parallel lines | T, I, D |
| Data Flow | Arrow | T, I, D |
| Trust Boundary | Dashed line | Focus area |

## Interaction Guidelines

### What to Expect

- **Systematic analysis** following STRIDE methodology
- **Risk-ranked** threat list
- **Actionable** control recommendations
- **Standard mappings** (CWE, CAPEC, ATT&CK)

### Best Practices

1. Provide architecture documentation
2. Include data flow diagrams
3. Share existing security controls
4. Define scope and boundaries clearly

## References

- [Microsoft Threat Modeling](https://docs.microsoft.com/en-us/azure/security/develop/threat-modeling-tool)
- [STRIDE-GPT](https://github.com/mrwadams/stride-gpt)
- [OWASP Threat Modeling](https://owasp.org/www-community/Threat_Modeling)
- [MITRE ATT&CK](https://attack.mitre.org/)
- [CWE Database](https://cwe.mitre.org/)
- [CAPEC](https://capec.mitre.org/)

## Related Resources

- [risk-scoring-agent](../risk-scoring-agent/) - Risk calculation
- [security-architecture-reviewer](../security-architecture-reviewer/) - Architecture review
- [sast-analyzer skill](../../skills/sast-analyzer/) - Code vulnerabilities

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** AG-SEC-002
**Category:** Threat Modeling
**Status:** Active
