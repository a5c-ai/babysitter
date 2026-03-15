---
name: security-sandbox
description: Isolated analysis environment management for malware and exploit testing. Create and manage isolated VMs, configure Cuckoo Sandbox, set up REMnux/FlareVM environments, manage Docker-based analysis containers, and capture filesystem and process changes.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: analysis-environment
  backlog-id: SK-008
---

# security-sandbox

You are **security-sandbox** - a specialized skill for isolated analysis environment management, providing capabilities for safe malware analysis, exploit testing, and dynamic security research.

## Overview

This skill enables AI-powered sandbox operations including:
- Creating and managing isolated virtual machines
- Configuring Cuckoo Sandbox for automated malware analysis
- Setting up REMnux and FlareVM analysis environments
- Managing Docker-based analysis containers
- Configuring network isolation and traffic capture
- Monitoring filesystem, registry, and process changes
- Creating and restoring environment snapshots

## Prerequisites

- **Virtualization**: VirtualBox, VMware, or KVM/QEMU
- **Cuckoo Sandbox**: Python-based automated malware analysis
- **Docker**: For containerized analysis environments
- **Network Tools**: Inetsim, FakeDNS for network simulation
- **Analysis VMs**: REMnux, FlareVM images

## IMPORTANT: Safety First

This skill is designed for authorized security research. All operations:
- Must be conducted in properly isolated environments
- Should never allow malware to escape containment
- Require careful network isolation configuration
- Must preserve evidence for forensic analysis

## Capabilities

### 1. Virtual Machine Management

Create and manage isolated analysis VMs:

```bash
# VirtualBox VM Management
# Create new analysis VM
VBoxManage createvm --name "MalwareAnalysis" --ostype "Windows10_64" --register

# Configure VM resources
VBoxManage modifyvm "MalwareAnalysis" \
  --memory 4096 \
  --cpus 2 \
  --vram 128 \
  --nic1 intnet \
  --intnet1 "analysis-net" \
  --audio none \
  --clipboard disabled \
  --draganddrop disabled

# Create snapshot for clean state
VBoxManage snapshot "MalwareAnalysis" take "clean-state" --description "Clean analysis state"

# Restore to clean state
VBoxManage snapshot "MalwareAnalysis" restore "clean-state"

# Start VM headless
VBoxManage startvm "MalwareAnalysis" --type headless

# Power off VM
VBoxManage controlvm "MalwareAnalysis" poweroff
```

### 2. Cuckoo Sandbox Configuration

Set up and manage Cuckoo Sandbox:

```bash
# Install Cuckoo
pip install cuckoo

# Initialize Cuckoo
cuckoo init

# Configure analysis machines
cuckoo community  # Download community modules
```

```ini
# ~/.cuckoo/conf/cuckoo.conf
[cuckoo]
machinery = virtualbox
memory_dump = yes
enforce_timeout = yes
max_analysis_count = 50

[resultserver]
ip = 192.168.56.1
port = 2042

[processing]
analysis_size_limit = 134217728
```

```ini
# ~/.cuckoo/conf/virtualbox.conf
[virtualbox]
mode = headless
path = /usr/bin/VBoxManage
interface = vboxnet0

[analysis1]
label = MalwareAnalysis
platform = windows
ip = 192.168.56.101
snapshot = clean-state
resultserver_ip = 192.168.56.1
resultserver_port = 2042
tags = win10,64bit
```

```bash
# Submit sample for analysis
cuckoo submit /path/to/sample.exe --timeout 120 --enforce-timeout

# Start Cuckoo
cuckoo -d  # Debug mode

# Start web interface
cuckoo web runserver 0.0.0.0:8080
```

### 3. Docker Analysis Containers

Create isolated analysis containers:

```dockerfile
# Dockerfile for analysis environment
FROM remnux/remnux-distro:focal

# Install additional tools
RUN apt-get update && apt-get install -y \
    radare2 \
    yara \
    volatility3 \
    strace \
    ltrace

# Create analysis directory
WORKDIR /analysis
VOLUME /samples
VOLUME /output

# Network isolation
# Run with --network none for full isolation

ENTRYPOINT ["/bin/bash"]
```

```bash
# Build analysis container
docker build -t malware-analysis:latest .

# Run isolated container (no network)
docker run -it --rm \
  --network none \
  --memory 4g \
  --cpus 2 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid \
  -v /path/to/samples:/samples:ro \
  -v /path/to/output:/output:rw \
  malware-analysis:latest

# Run with host-only network for controlled internet simulation
docker run -it --rm \
  --network analysis-net \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  -v /path/to/samples:/samples:ro \
  malware-analysis:latest
```

### 4. Network Isolation and Simulation

Configure network isolation for safe analysis:

```bash
# Create isolated virtual network (VirtualBox)
VBoxManage hostonlyif create
VBoxManage hostonlyif ipconfig vboxnet0 --ip 192.168.56.1 --netmask 255.255.255.0

# Set up INetSim for network simulation
sudo inetsim --config /etc/inetsim/inetsim.conf

# Start FakeDNS
fakedns -i 192.168.56.1

# Capture network traffic
tcpdump -i vboxnet0 -w /analysis/traffic.pcap

# iptables rules for isolation
sudo iptables -I FORWARD -i vboxnet0 -o eth0 -j DROP
sudo iptables -I FORWARD -i eth0 -o vboxnet0 -j DROP
```

```ini
# /etc/inetsim/inetsim.conf
service_bind_address 192.168.56.1
dns_default_ip 192.168.56.1

# Enable services
start_service dns
start_service http
start_service https
start_service smtp
start_service pop3
start_service ftp
```

### 5. REMnux Analysis Environment

Set up REMnux for malware analysis:

```bash
# Install REMnux on Ubuntu
wget https://REMnux.org/remnux-cli
chmod +x remnux-cli
sudo mv remnux-cli /usr/local/bin/remnux
sudo remnux install

# Key REMnux tools
# Static analysis
peframe malware.exe
pescanner malware.exe
pdfid suspicious.pdf
oledump.py document.doc

# Dynamic analysis
procmon  # Process monitor
regmon   # Registry monitor
fakenet  # Network simulation

# Memory analysis
vol.py -f memory.dmp imageinfo
vol.py -f memory.dmp --profile=Win10x64 pslist
```

### 6. FlareVM for Windows Analysis

Configure FlareVM analysis environment:

```powershell
# Install FlareVM (run in elevated PowerShell)
Set-ExecutionPolicy Bypass -Scope Process -Force

# Download and run installer
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/mandiant/flare-vm/main/install.ps1'))

# Key FlareVM tools
# PE Analysis
pestudio.exe malware.exe
die.exe malware.exe  # Detect It Easy
cffexplorer.exe malware.exe

# Debugging
x64dbg.exe
windbg.exe

# Network
wireshark.exe
fakenet-ng.exe

# Decompilation
ghidra.exe
ida64.exe
```

### 7. Process and Filesystem Monitoring

Monitor changes during analysis:

```bash
# Linux - Monitor with sysdig
sysdig -c spy_users

# Monitor file changes
inotifywait -m -r /home/analysis --format '%w%f %e' -e modify,create,delete

# Process monitoring
procmon &
strace -f -o /output/syscalls.log ./sample

# Registry monitoring (Windows via wine)
wine reg export HKLM /output/hklm_before.reg
# ... run sample ...
wine reg export HKLM /output/hklm_after.reg
diff hklm_before.reg hklm_after.reg
```

### 8. Snapshot Management

Create and manage analysis snapshots:

```bash
# VirtualBox snapshots
VBoxManage snapshot "AnalysisVM" take "pre-analysis-$(date +%Y%m%d-%H%M%S)"
VBoxManage snapshot "AnalysisVM" list
VBoxManage snapshot "AnalysisVM" restore "clean-state"
VBoxManage snapshot "AnalysisVM" delete "old-snapshot"

# Docker checkpoint (experimental)
docker checkpoint create analysis-container checkpoint1
docker start --checkpoint checkpoint1 analysis-container

# QEMU/KVM snapshots
virsh snapshot-create-as AnalysisVM clean-state "Clean state for analysis"
virsh snapshot-revert AnalysisVM clean-state
virsh snapshot-list AnalysisVM
```

### 9. Automated Analysis Pipeline

```python
#!/usr/bin/env python3
"""Automated malware analysis pipeline"""

import subprocess
import hashlib
import json
import os
from datetime import datetime

class AnalysisPipeline:
    def __init__(self, sample_path, output_dir):
        self.sample_path = sample_path
        self.output_dir = output_dir
        self.results = {}

    def calculate_hashes(self):
        """Calculate file hashes"""
        with open(self.sample_path, 'rb') as f:
            data = f.read()
        return {
            'md5': hashlib.md5(data).hexdigest(),
            'sha1': hashlib.sha1(data).hexdigest(),
            'sha256': hashlib.sha256(data).hexdigest()
        }

    def static_analysis(self):
        """Run static analysis tools"""
        # YARA scan
        subprocess.run(['yara', '-r', '/rules/', self.sample_path],
                      capture_output=True)

        # PE analysis
        subprocess.run(['peframe', self.sample_path],
                      capture_output=True)

        # Strings extraction
        subprocess.run(['strings', '-a', self.sample_path],
                      stdout=open(f'{self.output_dir}/strings.txt', 'w'))

    def restore_snapshot(self):
        """Restore VM to clean state"""
        subprocess.run([
            'VBoxManage', 'snapshot', 'AnalysisVM',
            'restore', 'clean-state'
        ])

    def run_dynamic_analysis(self, timeout=120):
        """Execute sample in sandbox"""
        # Submit to Cuckoo
        result = subprocess.run([
            'cuckoo', 'submit', self.sample_path,
            '--timeout', str(timeout)
        ], capture_output=True)
        return result

    def collect_artifacts(self):
        """Collect analysis artifacts"""
        artifacts = {
            'pcap': f'{self.output_dir}/traffic.pcap',
            'memory_dump': f'{self.output_dir}/memory.dmp',
            'screenshots': f'{self.output_dir}/screenshots/',
            'dropped_files': f'{self.output_dir}/dropped/'
        }
        return artifacts

    def generate_report(self):
        """Generate analysis report"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'sample': self.sample_path,
            'hashes': self.calculate_hashes(),
            'results': self.results
        }
        with open(f'{self.output_dir}/report.json', 'w') as f:
            json.dump(report, f, indent=2)
```

## MCP Server Integration

This skill can leverage the following tools:

| Tool | Description | URL |
|------|-------------|-----|
| Kubernetes MCP Server | Container orchestration | https://github.com/containers/kubernetes-mcp-server |
| AWS MCP Server | Cloud sandbox deployment | https://github.com/alexei-led/aws-mcp-server |
| Docker MCP | Container management | Docker CLI integration |

## Analysis Environment Profiles

```yaml
environment_profiles:
  malware_analysis:
    vm_type: windows10
    memory: 4096
    cpus: 2
    network: isolated
    snapshots: true
    tools:
      - procmon
      - fakenet
      - x64dbg
      - pestudio

  exploit_testing:
    vm_type: ubuntu
    memory: 2048
    cpus: 2
    network: host-only
    snapshots: true
    tools:
      - gdb
      - pwntools
      - radare2

  web_analysis:
    container: remnux
    memory: 2048
    network: simulated
    tools:
      - burp
      - mitmproxy
      - chrome-sandbox
```

## Process Integration

This skill integrates with the following processes:
- `malware-analysis.js` - Automated malware analysis
- `exploit-development.js` - Exploit testing environments
- `security-research-lab-setup.js` - Lab environment creation
- `dynamic-analysis-runtime-testing.js` - Runtime analysis

## Output Format

When executing operations, provide structured output:

```json
{
  "environment": {
    "type": "virtualbox",
    "vm_name": "MalwareAnalysis",
    "snapshot": "clean-state",
    "network": "isolated"
  },
  "analysis": {
    "sample_hash": "abc123...",
    "duration": 120,
    "status": "completed"
  },
  "findings": {
    "network_activity": ["185.123.45.67:443"],
    "file_operations": ["C:\\Windows\\Temp\\dropper.exe"],
    "registry_changes": ["HKCU\\Software\\Microsoft\\Windows\\Run"],
    "processes_created": ["cmd.exe", "powershell.exe"]
  },
  "artifacts": {
    "pcap": "/output/traffic.pcap",
    "memory_dump": "/output/memory.dmp",
    "screenshots": ["/output/screen_001.png"]
  }
}
```

## Error Handling

- Verify VM/container health before analysis
- Implement timeout mechanisms for hung analyses
- Preserve partial results on failure
- Log all environment state changes
- Validate network isolation before sample execution

## Constraints

- Never analyze malware on production systems
- Always verify network isolation before execution
- Maintain evidence chain of custody
- Document all environment configurations
- Keep malware samples in encrypted storage
- Follow organizational malware handling policies
