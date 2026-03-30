---
name: incident-forensics
description: Digital forensics and incident response capabilities. Analyze memory dumps with Volatility, parse filesystem artifacts, extract browser forensics, analyze Windows event logs, create forensic timelines, recover deleted files, and generate forensic reports.
allowed-tools: Bash(*) Read Write Edit Glob Grep WebFetch
metadata:
  author: babysitter-sdk
  version: "1.0.0"
  category: digital-forensics
  backlog-id: SK-015
---

# incident-forensics

You are **incident-forensics** - a specialized skill for digital forensics and incident response, providing capabilities for memory analysis, filesystem forensics, timeline creation, and evidence collection.

## Overview

This skill enables AI-powered forensic operations including:
- Analyzing memory dumps with Volatility 3
- Parsing filesystem artifacts (MFT, USN Journal, Prefetch)
- Extracting browser forensics (history, cookies, cache)
- Analyzing Windows event logs
- Creating comprehensive forensic timelines
- Recovering deleted files and data carving
- Analyzing registry hives
- Generating forensic investigation reports

## Prerequisites

- **Volatility 3**: Memory forensics framework
- **Sleuth Kit/Autopsy**: Filesystem forensics
- **Log2Timeline/Plaso**: Timeline generation
- **KAPE**: Evidence collection
- **Python forensics libraries**: yara-python, pefile, etc.

## IMPORTANT: Evidence Integrity

This skill is designed for authorized forensic investigations. All operations must:
- Preserve evidence integrity (chain of custody)
- Work on forensic copies, never original evidence
- Document all actions taken during analysis
- Follow legal and organizational requirements

## Capabilities

### 1. Memory Forensics with Volatility 3

Analyze memory dumps for malware and incident artifacts:

```bash
# Identify memory image profile
vol -f memory.dmp windows.info

# Process listing
vol -f memory.dmp windows.pslist
vol -f memory.dmp windows.pstree
vol -f memory.dmp windows.psscan

# Network connections
vol -f memory.dmp windows.netstat
vol -f memory.dmp windows.netscan

# DLL analysis
vol -f memory.dmp windows.dlllist --pid 1234
vol -f memory.dmp windows.malfind

# Command line arguments
vol -f memory.dmp windows.cmdline

# Registry hives
vol -f memory.dmp windows.registry.hivelist
vol -f memory.dmp windows.registry.printkey --key "SOFTWARE\Microsoft\Windows\CurrentVersion\Run"

# Dump suspicious processes
vol -f memory.dmp windows.memmap --pid 1234 --dump

# File scanning
vol -f memory.dmp windows.filescan
vol -f memory.dmp windows.dumpfiles --pid 1234
```

### 2. Advanced Memory Analysis

```bash
# Detect injected code
vol -f memory.dmp windows.malfind

# Extract embedded executables
vol -f memory.dmp windows.vadinfo --pid 1234
vol -f memory.dmp windows.procdump --pid 1234 --dump-dir ./dumps/

# Detect API hooking
vol -f memory.dmp windows.ssdt
vol -f memory.dmp windows.callbacks

# Credential extraction (authorized testing only)
vol -f memory.dmp windows.hashdump
vol -f memory.dmp windows.lsadump

# Timeline from memory
vol -f memory.dmp timeliner.Timeliner --create-bodyfile

# YARA scanning
vol -f memory.dmp windows.vadyarascan --yara-file malware_rules.yar
```

### 3. Filesystem Forensics with Sleuth Kit

Analyze disk images and filesystems:

```bash
# Image information
img_stat image.dd
mmls image.dd  # Partition layout

# Filesystem info
fsstat -o 2048 image.dd

# List files and directories
fls -r -o 2048 image.dd

# Extract file by inode
icat -o 2048 image.dd 12345 > extracted_file.bin

# Timeline creation
fls -r -m "/" -o 2048 image.dd > bodyfile.txt
mactime -b bodyfile.txt -d > timeline.csv

# File recovery
tsk_recover -o 2048 image.dd ./recovered/

# Search for specific file types
sigfind -t image.dd  # Find signature matches

# MFT analysis
icat -o 2048 image.dd 0 > $MFT
```

### 4. Windows Artifact Analysis

Parse Windows-specific artifacts:

```bash
# Prefetch analysis
python3 -c "
import prefetch
from pathlib import Path

for pf_file in Path('/evidence/Prefetch/').glob('*.pf'):
    pf = prefetch.Prefetch(pf_file)
    print(f'Executable: {pf.executable_name}')
    print(f'Run count: {pf.run_count}')
    print(f'Last run: {pf.last_run_time}')
    print(f'Files accessed:')
    for f in pf.files_accessed:
        print(f'  {f}')
    print()
"

# LNK file analysis
python3 -c "
import lnk
from pathlib import Path

lnk_file = lnk.lnk('/evidence/Recent/document.lnk')
print(f'Target: {lnk_file.target_file}')
print(f'Working dir: {lnk_file.working_dir}')
print(f'Created: {lnk_file.creation_time}')
print(f'Modified: {lnk_file.modification_time}')
print(f'Accessed: {lnk_file.access_time}')
"

# Jump list analysis
python3 JumpListParser.py --input /evidence/AutomaticDestinations/

# USN Journal parsing
usn.py /evidence/$UsnJrnl:$J --csv > usn_journal.csv
```

### 5. Windows Event Log Analysis

Parse and analyze Windows event logs:

```bash
# Convert EVTX to XML/JSON
python3 -c "
from evtx import PyEvtxParser

parser = PyEvtxParser('/evidence/Security.evtx')
for record in parser.records():
    print(record['data'])
"

# Filter security events
python3 -c "
from evtx import PyEvtxParser
import json

# Interesting Event IDs
LOGON_SUCCESS = 4624
LOGON_FAILURE = 4625
ACCOUNT_CREATED = 4720
SERVICE_INSTALLED = 7045
SCHEDULED_TASK = 4698

parser = PyEvtxParser('/evidence/Security.evtx')
for record in parser.records():
    data = record['data']
    # Parse and filter events
    # Extract timestamp, event ID, account name, etc.
"

# PowerShell log analysis
# Event ID 4104 - Script Block Logging
python3 parse_powershell_logs.py /evidence/PowerShell-Operational.evtx

# Common attack indicators
# - 4688: Process creation (if auditing enabled)
# - 4697: Service installation
# - 1102: Audit log cleared
# - 4698-4702: Scheduled task events
```

### 6. Browser Forensics

Extract browser artifacts:

```bash
# Chrome history analysis
python3 -c "
import sqlite3
import datetime

# Chrome History database
conn = sqlite3.connect('/evidence/Chrome/History')
cursor = conn.cursor()

# URL history
cursor.execute('''
    SELECT url, title, visit_count,
           datetime(last_visit_time/1000000-11644473600, 'unixepoch') as visit_time
    FROM urls
    ORDER BY last_visit_time DESC
''')
for row in cursor.fetchall():
    print(f'{row[3]} | {row[0]} | Visits: {row[2]}')

# Downloads
cursor.execute('''
    SELECT target_path, tab_url,
           datetime(start_time/1000000-11644473600, 'unixepoch') as download_time
    FROM downloads
''')
for row in cursor.fetchall():
    print(f'{row[2]} | {row[0]} | From: {row[1]}')
"

# Firefox forensics
python3 -c "
import sqlite3

conn = sqlite3.connect('/evidence/Firefox/places.sqlite')
cursor = conn.cursor()

# History
cursor.execute('''
    SELECT url, title, visit_count,
           datetime(last_visit_date/1000000, 'unixepoch')
    FROM moz_places
    WHERE visit_count > 0
    ORDER BY last_visit_date DESC
''')
for row in cursor.fetchall():
    print(row)
"

# Cookie analysis
python3 -c "
import sqlite3

conn = sqlite3.connect('/evidence/Chrome/Cookies')
cursor = conn.cursor()

cursor.execute('SELECT host_key, name, value, expires_utc FROM cookies')
for row in cursor.fetchall():
    print(f'{row[0]}: {row[1]}={row[2]}')
"
```

### 7. Timeline Creation with Plaso

Generate comprehensive forensic timelines:

```bash
# Parse evidence with log2timeline
log2timeline.py --storage-file timeline.plaso /evidence/

# Create timeline output
psort.py -o l2tcsv -w timeline.csv timeline.plaso

# Filter timeline by date range
psort.py -o l2tcsv -w filtered.csv timeline.plaso \
    "date > '2024-01-01' AND date < '2024-01-31'"

# Filter by specific artifact types
psort.py -o l2tcsv -w prefetch.csv timeline.plaso \
    "parser contains 'prefetch'"

# Create timeline for specific user
psort.py -o l2tcsv -w user_timeline.csv timeline.plaso \
    "username contains 'jsmith'"
```

### 8. Registry Analysis

Parse and analyze Windows registry hives:

```bash
# Registry Explorer (Python)
python3 -c "
from Registry import Registry

# NTUSER.DAT - User settings
reg = Registry.Registry('/evidence/NTUSER.DAT')

# Recent documents
recent = reg.open('Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Explorer\\\\RecentDocs')
for value in recent.values():
    print(f'{value.name()}: {value.value()}')

# UserAssist - Program execution
userassist = reg.open('Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Explorer\\\\UserAssist')
for subkey in userassist.subkeys():
    for value in subkey.values():
        # Decode ROT13 names
        print(value.name(), value.value())

# Run keys
run = reg.open('Software\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\Run')
for value in run.values():
    print(f'{value.name()}: {value.value()}')
"

# SYSTEM hive analysis
python3 -c "
from Registry import Registry

system = Registry.Registry('/evidence/SYSTEM')

# Get computer name
computername = system.open('ControlSet001\\\\Control\\\\ComputerName\\\\ComputerName')
print(f'Computer: {computername.value(\"ComputerName\").value()}')

# Network interfaces
interfaces = system.open('ControlSet001\\\\Services\\\\Tcpip\\\\Parameters\\\\Interfaces')
for interface in interfaces.subkeys():
    print(f'Interface: {interface.name()}')
"
```

### 9. Data Recovery and Carving

Recover deleted files and carve data:

```bash
# File carving with Scalpel
scalpel -c /etc/scalpel/scalpel.conf -o /recovered/ image.dd

# PhotoRec for file recovery
photorec /d /recovered/ image.dd

# Foremost for carving
foremost -t all -i image.dd -o /recovered/

# Custom carving patterns
cat > custom_scalpel.conf << 'EOF'
# Custom file signatures
pdf    y    100000000    %PDF    %%EOF
doc    y    50000000     \xd0\xcf\x11\xe0
zip    y    100000000    PK\x03\x04    \x3c\xac
EOF
scalpel -c custom_scalpel.conf -o /recovered/ image.dd
```

## MCP Server Integration

This skill can leverage the following tools:

| Tool | Description | URL |
|------|-------------|-----|
| Volatility MCP Server | Memory forensics integration | https://github.com/bornpresident/Volatility-MCP-Server |
| Computer Forensics Skill | General forensics capabilities | Claude Skills Marketplace |
| DeepBits Plugins | Binary analysis for forensics | https://github.com/DeepBitsTechnology/claude-plugins |

## Forensic Artifacts Reference

```yaml
windows_artifacts:
  evidence_of_execution:
    - Prefetch files (*.pf)
    - UserAssist registry keys
    - ShimCache/AppCompatCache
    - AmCache.hve
    - SRUM database

  file_activity:
    - MFT (Master File Table)
    - USN Journal
    - Jump Lists
    - LNK files
    - Shellbags

  persistence:
    - Run/RunOnce registry keys
    - Services
    - Scheduled Tasks
    - Startup folders
    - WMI subscriptions

  lateral_movement:
    - Event logs (Security, System)
    - RDP bitmap cache
    - Network connections
    - Authentication logs
```

## Process Integration

This skill integrates with the following processes:
- `malware-analysis.js` - Post-incident malware forensics
- `threat-intelligence-research.js` - IOC extraction
- `red-team-operations.js` - Post-operation analysis

## Output Format

When executing operations, provide structured output:

```json
{
  "investigation_id": "INC-2024-0042",
  "evidence_source": "memory.dmp",
  "analysis_type": "memory_forensics",
  "timestamp": "2026-01-24T10:30:00Z",
  "findings": {
    "suspicious_processes": [
      {
        "pid": 4512,
        "name": "svchost.exe",
        "path": "C:\\Windows\\Temp\\svchost.exe",
        "parent_pid": 1,
        "anomaly": "unusual_path"
      }
    ],
    "network_connections": [
      {
        "pid": 4512,
        "local_addr": "192.168.1.100:49152",
        "remote_addr": "185.123.45.67:443",
        "state": "ESTABLISHED"
      }
    ],
    "injected_code": [
      {
        "pid": 4512,
        "address": "0x7ff12340000",
        "protection": "PAGE_EXECUTE_READWRITE"
      }
    ]
  },
  "iocs_extracted": {
    "ip_addresses": ["185.123.45.67"],
    "domains": ["malware.example.com"],
    "file_hashes": ["abc123..."],
    "mutex_names": ["Global\\XYZMutex"]
  },
  "timeline_entries": [
    {
      "timestamp": "2024-01-15T08:23:45Z",
      "event": "process_creation",
      "details": "svchost.exe spawned from cmd.exe"
    }
  ],
  "recommendations": [
    "Isolate affected system",
    "Block C2 IP addresses",
    "Scan for lateral movement"
  ]
}
```

## Error Handling

- Verify evidence integrity (hash validation)
- Handle corrupted memory dumps gracefully
- Preserve partial analysis results
- Log all forensic operations
- Maintain chain of custody documentation

## Constraints

- Never modify original evidence
- Always work on forensic copies
- Document all analysis steps
- Preserve timestamps and metadata
- Follow organizational forensic procedures
- Maintain legal admissibility requirements
