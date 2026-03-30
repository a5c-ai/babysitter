# Security Sandbox Skill

## Overview

The `security-sandbox` skill provides isolated analysis environment management for malware and exploit testing. It enables creation and management of VMs, Cuckoo Sandbox configuration, Docker-based analysis containers, and comprehensive artifact collection.

## Quick Start

### Prerequisites

1. **Virtualization Platform** - VirtualBox, VMware, or KVM/QEMU
2. **Cuckoo Sandbox** - For automated malware analysis
3. **Docker** - For containerized environments
4. **Analysis VMs** - REMnux, FlareVM images
5. **Network Tools** - INetSim for network simulation

### Installation

The skill is included in the babysitter-sdk. Install required tools:

```bash
# Install VirtualBox
sudo apt install virtualbox virtualbox-ext-pack

# Install Cuckoo Sandbox
pip install cuckoo
cuckoo init
cuckoo community

# Install Docker
sudo apt install docker.io
sudo usermod -aG docker $USER

# Install network simulation
sudo apt install inetsim
```

## Usage

### Basic Operations

```bash
# Create isolated analysis VM
/skill security-sandbox create-vm \
  --name MalwareAnalysis \
  --os windows10 \
  --memory 4096 \
  --network isolated

# Submit sample to Cuckoo
/skill security-sandbox analyze \
  --sample /path/to/malware.exe \
  --timeout 120 \
  --output /analysis/results

# Start Docker analysis container
/skill security-sandbox docker-analyze \
  --image remnux/remnux-distro \
  --sample /path/to/malware \
  --network none
```

### Within Babysitter Processes

```javascript
// In a process file
const result = await ctx.task(sandboxAnalysisTask, {
  operation: 'malware-analysis',
  sample: '/samples/suspicious.exe',
  environment: 'cuckoo',
  timeout: 180,
  collectMemoryDump: true,
  networkSimulation: 'inetsim'
});
```

## Capabilities

| Capability | Description |
|------------|-------------|
| **VM Management** | Create, snapshot, restore VirtualBox/VMware VMs |
| **Cuckoo Integration** | Automated malware analysis submission |
| **Docker Isolation** | Containerized analysis environments |
| **Network Simulation** | INetSim, FakeDNS for controlled networking |
| **Artifact Collection** | PCAP, memory dumps, screenshots |
| **Process Monitoring** | Track filesystem, registry, process changes |

## Examples

### Example 1: Automated Malware Analysis

```bash
# Full malware analysis workflow
/skill security-sandbox full-analysis \
  --sample /samples/malware.exe \
  --environment cuckoo \
  --timeout 300 \
  --collect-memory \
  --collect-network \
  --generate-report \
  --output /analysis/report/
```

### Example 2: Create Analysis VM

```bash
# Create Windows analysis VM with FlareVM tools
/skill security-sandbox create-vm \
  --name FlareAnalysis \
  --os windows10 \
  --memory 8192 \
  --cpus 4 \
  --network isolated \
  --tools flarevm \
  --snapshot-clean
```

### Example 3: Docker-based Quick Analysis

```bash
# Quick static analysis in container
/skill security-sandbox docker-analyze \
  --image remnux/remnux-distro \
  --sample /samples/suspicious.bin \
  --network none \
  --tools "yara,strings,peframe" \
  --output /analysis/static/
```

### Example 4: Network Traffic Analysis

```bash
# Analyze with network simulation
/skill security-sandbox analyze-network \
  --sample /samples/dropper.exe \
  --network-sim inetsim \
  --capture-pcap \
  --dns-sinkhole \
  --output /analysis/network/
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CUCKOO_ROOT` | Cuckoo installation path | `~/.cuckoo` |
| `VBOX_USER_HOME` | VirtualBox config path | `~/.config/VirtualBox` |
| `ANALYSIS_OUTPUT` | Default output directory | `./analysis` |
| `INETSIM_CONFIG` | INetSim configuration | `/etc/inetsim/inetsim.conf` |

### Skill Configuration

```yaml
# .babysitter/skills/security-sandbox.yaml
security-sandbox:
  defaultPlatform: virtualbox
  defaultTimeout: 120
  networkMode: isolated
  collectArtifacts:
    memory: true
    network: true
    screenshots: true
    dropped: true
  snapshots:
    autoCreate: true
    cleanStateName: "clean-state"
  cuckoo:
    enabled: true
    webInterface: true
    apiPort: 8090
```

## Process Integration

### Processes Using This Skill

1. **malware-analysis.js** - Automated malware analysis workflows
2. **exploit-development.js** - Exploit testing environments
3. **security-research-lab-setup.js** - Lab environment creation
4. **dynamic-analysis-runtime-testing.js** - Runtime security analysis

### Example Process Integration

```javascript
import { defineTask } from '@a5c-ai/babysitter-sdk';

const malwareAnalysisTask = defineTask({
  name: 'sandbox-malware-analysis',
  description: 'Analyze malware sample in isolated sandbox',

  async run(inputs, taskCtx) {
    return {
      kind: 'skill',
      title: `Malware Analysis - ${inputs.sampleName}`,
      skill: {
        name: 'security-sandbox',
        context: {
          operation: 'full-analysis',
          samplePath: inputs.samplePath,
          environment: inputs.environment || 'cuckoo',
          timeout: inputs.timeout || 180,
          networkSimulation: 'inetsim',
          artifacts: {
            memoryDump: true,
            networkCapture: true,
            screenshots: true,
            droppedFiles: true
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

## Environment Types

### Analysis Environments

| Environment | Use Case | Network |
|-------------|----------|---------|
| Cuckoo Sandbox | Automated malware analysis | Simulated |
| REMnux VM | Linux malware, static analysis | Isolated |
| FlareVM | Windows malware, debugging | Isolated |
| Docker Container | Quick static analysis | None |

### Network Modes

| Mode | Description | Use When |
|------|-------------|----------|
| `none` | No network access | Static analysis, safe samples |
| `isolated` | Host-only network | Most dynamic analysis |
| `simulated` | INetSim/FakeDNS | Malware needing network |
| `monitored` | Real network with capture | Controlled environments |

## Artifact Collection

### Collected Artifacts

```
/analysis/
├── report.json           # Analysis summary
├── sample/
│   └── original.bin      # Original sample (encrypted)
├── network/
│   └── traffic.pcap      # Network capture
├── memory/
│   └── memory.dmp        # Memory dump
├── filesystem/
│   ├── created/          # Created files
│   ├── modified/         # Modified files
│   └── deleted.txt       # Deleted file list
├── registry/
│   ├── changes.reg       # Registry modifications
│   └── diff.txt          # Registry diff
├── screenshots/
│   ├── screen_001.png    # Timed screenshots
│   └── screen_002.png
└── logs/
    ├── process.log       # Process activity
    └── syscalls.log      # System call trace
```

## Security Considerations

### Network Isolation

Always verify network isolation before executing suspicious samples:

```bash
# Verify no external connectivity
/skill security-sandbox verify-isolation --vm MalwareAnalysis

# Check for network leaks
/skill security-sandbox network-check --interface vboxnet0
```

### Sample Handling

- Store samples in encrypted containers
- Use strong naming conventions (hash-based)
- Maintain chain of custody documentation
- Never execute samples on production systems

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| VM not starting | Check virtualization enabled in BIOS |
| Cuckoo analysis timeout | Increase timeout, check VM responsiveness |
| Network simulation failing | Verify INetSim configuration and binding |
| Docker permission denied | Add user to docker group |

### Debug Mode

Enable verbose output for troubleshooting:

```bash
SANDBOX_DEBUG=true /skill security-sandbox analyze --sample malware.exe
```

## Related Skills

- **malware-analysis** - Deep malware analysis techniques
- **network-analysis** - Network traffic analysis
- **memory-forensics** - Memory dump analysis

## References

- [Cuckoo Sandbox Documentation](https://cuckoo.readthedocs.io/)
- [REMnux Documentation](https://docs.remnux.org/)
- [FlareVM Installation](https://github.com/mandiant/flare-vm)
- [VirtualBox Manual](https://www.virtualbox.org/manual/)
- [Docker Security](https://docs.docker.com/engine/security/)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-24 | Initial release |

---

**Backlog ID:** SK-008
**Category:** Analysis Environment
**Status:** Active
