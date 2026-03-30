# Threat Intelligence Agent

Threat intelligence integration and analysis agent for IoC enrichment, threat actor profiling, and actionable intelligence reporting.

## Overview

This agent integrates and analyzes threat intelligence to support security operations. It queries threat feeds, enriches indicators of compromise, profiles threat actors, maps TTPs to MITRE ATT&CK, and generates actionable intelligence reports.

## Expertise Areas

- Threat intelligence feed integration
- Indicator of compromise matching and enrichment
- Threat actor identification and profiling
- TTP analysis and ATT&CK mapping
- Threat relevance assessment
- Intelligence report generation

## Key Capabilities

- **Feed Integration**: Query and aggregate multiple intelligence sources
- **IoC Enrichment**: Match and enrich indicators with context
- **Actor Profiling**: Identify threat actors and their capabilities
- **TTP Analysis**: Map behaviors to MITRE ATT&CK framework
- **Relevance Assessment**: Evaluate threats against organization profile
- **Reporting**: Generate strategic, tactical, and operational intelligence

## Intelligence Types

| Type | Audience | Focus |
|------|----------|-------|
| Strategic | Executives | Policy, investment decisions |
| Tactical | Architects | Security control guidance |
| Operational | SOC analysts | Incident response support |
| Technical | Security tools | Detection signatures |

## Intelligence Sources

**Commercial**: Recorded Future, Mandiant, CrowdStrike
**Open Source**: MISP, AlienVault OTX, Abuse.ch, VirusTotal
**Government**: CISA, FBI, ISACs, CERTs
**Internal**: Past incidents, red team findings

## Context Requirements

| Input | Description |
|-------|-------------|
| Organization Profile | Industry, geography, tech stack |
| Asset Information | Critical assets, attack surface |
| Current Alerts | Active events, incident IoCs |
| Intelligence Feeds | Access to threat sources |

## Output

Actionable intelligence reports including:
- Threat landscape overview
- Enriched indicator analysis
- Threat actor profiles
- TTP analysis with detection gaps
- Prioritized recommendations
- Early warning alerts

## Usage

```javascript
agent: {
  name: 'threat-intelligence-agent',
  prompt: {
    task: 'Analyze incident IoCs and provide threat context',
    context: {
      incidentIoCs: indicators,
      organizationProfile: { industry: 'Finance' },
      intelFeeds: ['OTX', 'VirusTotal']
    }
  }
}
```

## Related Components

- **Processes**: Incident Response, SOC Workflow, Threat Modeling
- **Collaborates With**: incident-triage-agent, forensic-analysis-agent
