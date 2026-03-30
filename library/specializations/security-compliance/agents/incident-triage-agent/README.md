# Incident Triage Agent

Automated security incident triage agent for rapid alert analysis, classification, and initial response recommendations.

## Overview

This agent provides automated security incident triage by parsing alerts from multiple sources, classifying severity, identifying affected systems, correlating events, mapping to MITRE ATT&CK, and recommending containment actions.

## Expertise Areas

- Security alert analysis
- Incident classification and prioritization
- Threat correlation and timeline building
- MITRE ATT&CK mapping
- Containment strategy recommendations
- Escalation determination

## Key Capabilities

- **Alert Parsing**: Normalize and analyze alerts from SIEM, EDR, IDS/IPS
- **Classification**: Determine incident type, severity, and business impact
- **Impact Analysis**: Identify affected systems and blast radius
- **Event Correlation**: Link related events and build attack timelines
- **ATT&CK Mapping**: Map behaviors to tactics and techniques
- **Containment**: Recommend prioritized containment actions

## Severity Levels

| Level | Description | Response |
|-------|-------------|----------|
| P1 - Critical | Active breach, critical systems | Immediate |
| P2 - High | Confirmed malware, lateral movement | 1 hour |
| P3 - Medium | Suspicious activity, potential compromise | 4 hours |
| P4 - Low | Minor anomalies, informational | 24 hours |

## Incident Categories

- Malware (ransomware, trojans, worms)
- Intrusion (unauthorized access, account compromise)
- Data Breach (exfiltration, unauthorized disclosure)
- DoS/DDoS (availability attacks)
- Insider Threat (malicious or negligent)
- Policy Violation (security policy non-compliance)

## Context Requirements

| Input | Description |
|-------|-------------|
| SIEM Data | Event logs, alert details, correlations |
| Alert Context | Source, detection time, entities |
| Asset Info | Criticality, owner, network location |
| Threat Intel | Current threats, active campaigns |

## Output

Structured triage report including:
- Incident classification and severity
- Affected systems and impact analysis
- MITRE ATT&CK mapping
- Correlated event timeline
- Containment recommendations
- Escalation requirements

## Usage

```javascript
agent: {
  name: 'incident-triage-agent',
  prompt: {
    task: 'Triage incoming security alert',
    context: {
      alertData: alertPayload,
      siemSource: 'Splunk'
    }
  }
}
```

## Related Components

- **Processes**: Security Incident Response, SOC Workflow
- **Collaborates With**: forensic-analysis-agent, threat-intelligence-agent
