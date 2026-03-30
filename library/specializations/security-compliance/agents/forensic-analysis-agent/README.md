# Forensic Analysis Agent

Digital forensic analysis agent for incident investigation, timeline reconstruction, and IoC identification.

## Overview

This agent provides AI-assisted digital forensic analysis to support incident investigations. It analyzes logs, reconstructs attack timelines, identifies indicators of compromise, analyzes malware behavior, and generates detailed forensic reports.

## Expertise Areas

- Log file analysis and correlation
- Attack timeline reconstruction
- Indicator of compromise (IoC) extraction
- Malware behavior analysis
- Evidence preservation guidance
- Forensic report generation

## Key Capabilities

- **Log Analysis**: Parse and correlate logs from multiple sources
- **Timeline Building**: Reconstruct comprehensive attack sequences
- **IoC Extraction**: Identify hashes, IPs, domains, file paths
- **Malware Analysis**: Document behavior, persistence, C2 communications
- **Evidence Handling**: Guide preservation and chain of custody
- **Reporting**: Generate detailed forensic documentation

## Analysis Types

| Type | Artifacts | Focus |
|------|-----------|-------|
| Log Analysis | Event logs, syslogs | Timeline, anomalies |
| File System | Disk images | Malware, data access |
| Memory | Memory dumps | Running processes, credentials |
| Network | PCAP, NetFlow | C2, exfiltration |
| Registry | Hives | Persistence, changes |

## MITRE ATT&CK Integration

Maps all findings to the ATT&CK framework including:
- Initial Access vectors
- Execution methods
- Persistence mechanisms
- Lateral movement paths
- Exfiltration techniques

## Context Requirements

| Input | Description |
|-------|-------------|
| Forensic Artifacts | Log files, disk images, memory dumps |
| System Logs | Event logs, syslogs, application logs |
| Network Captures | PCAP, NetFlow, firewall logs |
| Incident Context | Alert, triage findings, scope |

## Output

Detailed forensic report including:
- Executive summary
- Attack timeline
- Indicators of compromise
- Malware analysis
- Evidence inventory
- ATT&CK mapping
- Recommendations

## Usage

```javascript
agent: {
  name: 'forensic-analysis-agent',
  prompt: {
    task: 'Analyze forensic artifacts from compromised system',
    context: {
      artifacts: { diskImage: '/evidence/disk.dd' },
      incidentContext: triageReport
    }
  }
}
```

## Related Components

- **Processes**: Security Incident Response, SOC Workflow
- **Collaborates With**: incident-triage-agent, threat-intelligence-agent
