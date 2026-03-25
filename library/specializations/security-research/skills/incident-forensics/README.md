# Incident Forensics Skill

## Overview

The `incident-forensics` skill provides digital forensics and incident response capabilities for analyzing memory dumps, filesystem artifacts, event logs, and creating forensic timelines. It leverages Volatility 3, Sleuth Kit, and Plaso for comprehensive forensic investigations.

## Quick Start

### Prerequisites

1. **Volatility 3** - Memory forensics framework
2. **Sleuth Kit** - Filesystem forensics tools
3. **Plaso/Log2Timeline** - Timeline generation
4. **Python Libraries** - evtx, Registry, prefetch parsers

### Installation

The skill is included in the babysitter-sdk. Install required tools:

```bash
# Install Volatility 3
pip install volatility3

# Install Sleuth Kit
sudo apt install sleuthkit

# Install Plaso
pip install plaso

# Install Python forensics libraries
pip install python-evtx python-registry prefetch
```

## Usage

### Basic Operations

```bash
# Analyze memory dump
/skill incident-forensics analyze-memory \
  --image memory.dmp \
  --plugins pslist,netscan,malfind \
  --output /analysis/

# Parse filesystem
/skill incident-forensics analyze-disk \
  --image disk.dd \
  --offset 2048 \
  --timeline \
  --output /analysis/

# Create forensic timeline
/skill incident-forensics create-timeline \
  --evidence-dir /evidence/ \
  --start-date 2024-01-01 \
  --end-date 2024-01-31 \
  --output timeline.csv
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(forensicsTask, {
  operation: 'memory-analysis',
  imagePath: '/evidence/memory.dmp',
  plugins: ['pslist', 'netscan', 'malfind', 'cmdline'],
  extractArtifacts: true,
  outputPath: '/analysis/results/'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **Memory Forensics** | Volatility 3 memory analysis |
| **Filesystem Analysis** | Sleuth Kit disk forensics |
| **Timeline Creation** | Plaso/Log2Timeline timelines |
| **Event Log Parsing** | Windows EVTX analysis |
| **Registry Analysis** | Windows registry hive parsing |
| **Browser Forensics** | Chrome, Firefox, Edge artifacts |
| **Data Recovery** | Deleted file recovery, carving |

## Examples

### Example 1: Full Memory Analysis

```bash
# Comprehensive memory investigation
/skill incident-forensics analyze-memory \
  --image /evidence/memory.dmp \
  --plugins all \
  --yara-rules /rules/malware.yar \
  --extract-processes \
  --extract-files \
  --output /analysis/memory/
```

### Example 2: Incident Timeline

```bash
# Generate incident timeline
/skill incident-forensics create-timeline \
  --evidence-dir /evidence/ \
  --parsers prefetch,evtx,mft,usnjrnl \
  --filter-date "2024-01-15" \
  --filter-user "jsmith" \
  --output-format csv \
  --output /analysis/timeline.csv
```

### Example 3: Malware Indicator Extraction

```bash
# Extract IOCs from memory
/skill incident-forensics extract-iocs \
  --image /evidence/memory.dmp \
  --types ip,domain,hash,mutex \
  --context network,process \
  --output /analysis/iocs.json
```

### Example 4: Registry Analysis

```bash
# Analyze persistence mechanisms
/skill incident-forensics analyze-registry \
  --hives /evidence/registry/ \
  --check-persistence \
  --check-execution \
  --user-activity \
  --output /analysis/registry_report.json
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VOL_PLUGIN_DIR` | Volatility plugins | System default |
| `SLEUTHKIT_PATH` | Sleuth Kit binaries | System PATH |
| `PLASO_PARSER_FILTER` | Default parsers | All parsers |
| `YARA_RULES_DIR` | YARA rules directory | None |

### Skill Configuration

```yaml
# .babysitter/skills/incident-forensics.yaml
incident-forensics:
  volatility:
    version: 3
    defaultPlugins:
      - pslist
      - pstree
      - netscan
      - malfind
    extractDumps: true
  timeline:
    defaultParsers:
      - prefetch
      - evtx
      - mft
    outputFormat: csv
  chainOfCustody: true
  hashAlgorithm: sha256
```

## Process Integration

### Processes Using This Skill

1. **malware-analysis.js** - Post-incident malware forensics
2. **threat-intelligence-research.js** - IOC extraction from evidence
3. **red-team-operations.js** - Post-operation forensic analysis

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const incidentForensicsTask = defineTask({
  name: 'incident-forensics-analysis',
  description: 'Perform forensic analysis on incident evidence',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Forensic Analysis - ${inputs.incidentId}`,
      skill: {
        name: 'incident-forensics',
        context: {
          operation: 'comprehensive-analysis',
          incidentId: inputs.incidentId,
          evidencePaths: inputs.evidencePaths,
          analysis: {
            memory: inputs.memoryImage ? true : false,
            disk: inputs.diskImage ? true : false,
            timeline: true,
            iocExtraction: true
          },
          timeframe: {
            start: inputs.startDate,
            end: inputs.endDate
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

## Volatility 3 Plugin Reference

### Process Analysis

| Plugin | Description |
|--------|-------------|
| `windows.pslist` | List processes |
| `windows.pstree` | Process tree |
| `windows.psscan` | Scan for processes |
| `windows.cmdline` | Command line arguments |
| `windows.dlllist` | List loaded DLLs |

### Network Analysis

| Plugin | Description |
|--------|-------------|
| `windows.netscan` | Scan for connections |
| `windows.netstat` | Active connections |

### Malware Detection

| Plugin | Description |
|--------|-------------|
| `windows.malfind` | Find injected code |
| `windows.vadyarascan` | YARA scan memory |
| `windows.ssdt` | SSDT hooks |
| `windows.callbacks` | Kernel callbacks |

### Credential Extraction

| Plugin | Description |
|--------|-------------|
| `windows.hashdump` | Password hashes |
| `windows.lsadump` | LSA secrets |

## Forensic Artifacts

### Evidence of Execution

| Artifact | Location | Information |
|----------|----------|-------------|
| Prefetch | `C:\Windows\Prefetch` | Execution times, count |
| UserAssist | Registry NTUSER.DAT | Program execution |
| ShimCache | SYSTEM hive | Execution evidence |
| AmCache | `C:\Windows\appcompat` | Execution metadata |

### Persistence Mechanisms

| Artifact | Location | Detection |
|----------|----------|-----------|
| Run Keys | Registry | Startup programs |
| Services | SYSTEM hive | Malicious services |
| Tasks | `C:\Windows\Tasks` | Scheduled tasks |
| WMI | WMI repository | Event subscriptions |

## Security Considerations

### Evidence Integrity

- Always work on forensic copies
- Calculate and verify hashes
- Document chain of custody
- Preserve original timestamps

### Legal Requirements

- Follow organizational procedures
- Maintain admissibility requirements
- Document all analysis steps
- Protect sensitive findings

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| `Volatility profile not found` | Volatility 3 auto-detects, check image integrity |
| `Cannot parse filesystem` | Verify offset, check partition table |
| `Timeline too large` | Filter by date or parser |
| `Registry hive corrupted` | Try partial parsing |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
FORENSICS_DEBUG=true /skill incident-forensics analyze-memory --image memory.dmp
```

## Related Skills

- **malware-analysis** - Malware examination
- **network-forensics** - Network traffic analysis
- **security-sandbox** - Safe analysis environment

## References

- [Volatility 3 Documentation](https://volatility3.readthedocs.io/)
- [Sleuth Kit Documentation](https://wiki.sleuthkit.org/)
- [Plaso Documentation](https://plaso.readthedocs.io/)
- [SANS DFIR Resources](https://www.sans.org/digital-forensics-incident-response/)
- [Windows Forensic Analysis](https://www.13cubed.com/downloads/dfir_cheat_sheet.pdf)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-015
**Category:** Digital Forensics
**Status:** Active
