"""Scraper VM health checks via SSH.

Connects to the Windows scraper VM and runs PowerShell commands to assess
scheduled tasks, avatar session health, system resources, and GCS sync status.
"""

import base64
import csv
import io
import json
import logging
from datetime import datetime, timezone, timedelta

import paramiko

logger = logging.getLogger("pipeline-monitor.scraper_vm")

# Expected scheduled tasks to monitor
EXPECTED_TASKS = ["Telegram groups scheduler", "Whatsapp Groups Iris"]


def _powershell_encoded(script: str) -> str:
    """Encode a PowerShell script as a base64 -EncodedCommand string.

    This avoids all quoting/escaping issues when running PowerShell
    commands through paramiko SSH on Windows.
    """
    encoded = base64.b64encode(script.encode("utf-16-le")).decode("ascii")
    return f"powershell -EncodedCommand {encoded}"


def _run_ssh_command(ssh_client: paramiko.SSHClient, command: str, timeout: int = 60) -> str:
    """Execute a command over SSH and return stdout as a string.

    Raises RuntimeError if the command returns a non-zero exit code.
    """
    _, stdout, stderr = ssh_client.exec_command(command, timeout=timeout)
    exit_code = stdout.channel.recv_exit_status()
    output = stdout.read().decode("utf-8", errors="replace").strip()
    err_output = stderr.read().decode("utf-8", errors="replace").strip()

    if exit_code != 0:
        logger.warning(
            "SSH command exited with code %d: %s | stderr: %s",
            exit_code,
            command[:120],
            err_output[:500],
        )

    return output


def check_scheduled_tasks(ssh_client: paramiko.SSHClient) -> dict:
    """Check the status and last run time of Windows scheduled tasks.

    Args:
        ssh_client: Connected paramiko SSH client.

    Returns:
        Dict with task names as keys, each containing status, last_run_time,
        and overdue_hours.
    """
    try:
        output = _run_ssh_command(
            ssh_client, 'schtasks /Query /FO CSV /V'
        )
    except Exception:
        logger.exception("Failed to query scheduled tasks")
        return {"error": "Failed to query scheduled tasks via SSH"}

    results = {}
    now = datetime.now(timezone.utc)

    try:
        reader = csv.DictReader(io.StringIO(output))
        for row in reader:
            task_name = row.get("TaskName", "").strip().rsplit("\\", 1)[-1]
            if task_name not in EXPECTED_TASKS:
                continue

            status = row.get("Status", "Unknown").strip()
            last_run_raw = row.get("Last Run Time", "").strip()
            next_run_raw = row.get("Next Run Time", "").strip()

            last_run_time = None
            overdue_hours = None

            if last_run_raw and last_run_raw != "N/A":
                # Windows schtasks CSV typically uses MM/DD/YYYY HH:MM:SS format
                for fmt in ("%m/%d/%Y %H:%M:%S", "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                    try:
                        last_run_time = datetime.strptime(last_run_raw, fmt).replace(
                            tzinfo=timezone.utc
                        )
                        break
                    except ValueError:
                        continue

            if last_run_time:
                hours_since = (now - last_run_time).total_seconds() / 3600
                # Overdue = hours since last run minus expected interval (8h)
                overdue_hours = round(max(0, hours_since - 8), 1)
            else:
                overdue_hours = None

            results[task_name] = {
                "status": status,
                "last_run_time": last_run_time.isoformat() if last_run_time else None,
                "next_run_time": next_run_raw if next_run_raw else None,
                "overdue_hours": overdue_hours,
                "hours_since_last_run": round(hours_since, 1) if last_run_time else None,
            }
    except Exception:
        logger.exception("Failed to parse scheduled tasks CSV output")
        return {"error": "Failed to parse scheduled tasks output"}

    # Flag any expected tasks that were not found
    for task_name in EXPECTED_TASKS:
        if task_name not in results:
            results[task_name] = {
                "status": "Not Found",
                "last_run_time": None,
                "next_run_time": None,
                "overdue_hours": None,
                "hours_since_last_run": None,
            }

    return results


def check_avatar_health(
    ssh_client: paramiko.SSHClient,
    log_path: str = r"C:\irisdata\lOGS",
) -> dict:
    """Check avatar/agent session health from scheduler JSONL logs.

    Args:
        ssh_client: Connected paramiko SSH client.
        log_path: Path to the log directory on the Windows VM.

    Returns:
        Dict with per-agent stats including success_rate and last_activity.
    """
    cmd = _powershell_encoded(f'Get-Content "{log_path}\\scheduler.jsonl" -Tail 5000')
    try:
        output = _run_ssh_command(ssh_client, cmd, timeout=30)
    except Exception:
        logger.exception("Failed to read scheduler.jsonl")
        return {"error": "Failed to read scheduler.jsonl via SSH"}

    if not output:
        return {"error": "scheduler.jsonl is empty or not found"}

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(hours=24)

    # Parse JSONL lines
    agents: dict[str, dict] = {}

    for line in output.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            entry = json.loads(line)
        except json.JSONDecodeError:
            continue

        agent_name = entry.get("Agent_name") or entry.get("agent_name")
        if not agent_name:
            continue

        timestamp_raw = entry.get("timestamp")
        if not timestamp_raw:
            continue

        # Parse timestamp
        ts = None
        for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
            try:
                ts = datetime.strptime(timestamp_raw, fmt).replace(tzinfo=timezone.utc)
                break
            except ValueError:
                continue

        if ts is None:
            continue

        if agent_name not in agents:
            agents[agent_name] = {
                "total": 0,
                "success": 0,
                "error": 0,
                "last_activity": None,
                "type": entry.get("type", "Unknown"),
                "groups_collected": None,
                "members_collected": None,
                "messages_collected": None,
                "last_run_time": None,
            }

        agent = agents[agent_name]

        # Update last activity
        if agent["last_activity"] is None or ts > datetime.fromisoformat(agent["last_activity"]):
            agent["last_activity"] = ts.isoformat()

        # Extract collection counts from log entry (use latest non-None values)
        for field, keys in (
            ("groups_collected", ("groups_count", "groups_collected", "group_count")),
            ("members_collected", ("members_count", "members_collected", "member_count")),
            ("messages_collected", ("messages_count", "messages_collected", "message_count")),
        ):
            for key in keys:
                val = entry.get(key)
                if val is not None:
                    agent[field] = val
                    break

        # Track last run time (latest "started" or "success" timestamp)
        status_lower = (entry.get("status") or "").lower()
        if status_lower in ("started", "success"):
            if agent["last_run_time"] is None or ts.isoformat() > agent["last_run_time"]:
                agent["last_run_time"] = ts.isoformat()

        # Only count entries within the 24h window for rate calculation
        if ts >= cutoff:
            status = (entry.get("status") or "").lower()
            if status in ("started",):
                # Don't count 'Started' in success/error totals
                continue
            agent["total"] += 1
            if status == "success":
                agent["success"] += 1
            elif status == "error":
                agent["error"] += 1

    # Read Telegram-specific scheduler log
    try:
        tg_cmd = _powershell_encoded(
            f'Get-Content "{log_path}\\telegram_scheduler.jsonl" -Tail 5000'
        )
        tg_output = _run_ssh_command(ssh_client, tg_cmd, timeout=30)
        tg_entry_count = 0
        if tg_output:
            for tg_line in tg_output.splitlines():
                tg_line = tg_line.strip()
                if not tg_line:
                    continue
                try:
                    entry = json.loads(tg_line)
                except json.JSONDecodeError:
                    continue

                agent_name = entry.get("Agent_name") or entry.get("agent_name")
                if not agent_name:
                    continue

                timestamp_raw = entry.get("timestamp")
                if not timestamp_raw:
                    continue

                ts = None
                for fmt in ("%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ", "%Y-%m-%d %H:%M:%S"):
                    try:
                        ts = datetime.strptime(timestamp_raw, fmt).replace(tzinfo=timezone.utc)
                        break
                    except ValueError:
                        continue

                if ts is None:
                    continue

                tg_entry_count += 1

                if agent_name not in agents:
                    agents[agent_name] = {
                        "total": 0,
                        "success": 0,
                        "error": 0,
                        "last_activity": None,
                        "type": entry.get("type", "Telegram"),
                        "groups_collected": None,
                        "members_collected": None,
                        "messages_collected": None,
                        "last_run_time": None,
                    }

                agent = agents[agent_name]

                if agent["last_activity"] is None or ts > datetime.fromisoformat(agent["last_activity"]):
                    agent["last_activity"] = ts.isoformat()

                for field, keys in (
                    ("groups_collected", ("groups_count", "groups_collected", "group_count")),
                    ("members_collected", ("members_count", "members_collected", "member_count")),
                    ("messages_collected", ("messages_count", "messages_collected", "message_count")),
                ):
                    for key in keys:
                        val = entry.get(key)
                        if val is not None:
                            agent[field] = val
                            break

                status_lower = (entry.get("status") or "").lower()
                if status_lower in ("started", "success"):
                    if agent["last_run_time"] is None or ts.isoformat() > agent["last_run_time"]:
                        agent["last_run_time"] = ts.isoformat()

                if ts >= cutoff:
                    status = (entry.get("status") or "").lower()
                    if status in ("started",):
                        continue
                    agent["total"] += 1
                    if status == "success":
                        agent["success"] += 1
                    elif status == "error":
                        agent["error"] += 1

        logger.info("Telegram scheduler log: %d entries parsed", tg_entry_count)
    except Exception:
        logger.warning("Failed to read telegram_scheduler.jsonl (may not exist)", exc_info=True)

    # Compute success rates
    results = {}
    for agent_name, data in agents.items():
        total = data["total"]
        success_rate = (data["success"] / total) if total > 0 else None
        error_rate = (data["error"] / total) if total > 0 else None

        inactive_hours = None
        if data["last_activity"]:
            last_dt = datetime.fromisoformat(data["last_activity"])
            inactive_hours = round((now - last_dt).total_seconds() / 3600, 1)

        results[agent_name] = {
            "type": data["type"],
            "total_sessions_24h": total,
            "success_count": data["success"],
            "error_count": data["error"],
            "success_rate": round(success_rate, 3) if success_rate is not None else None,
            "error_rate": round(error_rate, 3) if error_rate is not None else None,
            "last_activity": data["last_activity"],
            "inactive_hours": inactive_hours,
            "last_run_time": data["last_run_time"],
            "groups_collected": data["groups_collected"],
            "members_collected": data["members_collected"],
            "messages_collected": data["messages_collected"],
        }

    # Discover all avatar config directories to find inactive avatars
    try:
        discover_cmd = _powershell_encoded(
            'Get-ChildItem "C:\\projects\\scrappers\\IM" -Directory -ErrorAction SilentlyContinue '
            '| Select-Object -ExpandProperty Name'
        )
        dir_output = _run_ssh_command(ssh_client, discover_cmd, timeout=15)
        discovered_dirs = []
        if dir_output:
            for dirname in dir_output.splitlines():
                dirname = dirname.strip()
                if dirname:
                    discovered_dirs.append(dirname)
                    if dirname not in results:
                        results[dirname] = {
                            "type": "Unknown",
                            "total_sessions_24h": 0,
                            "success_count": 0,
                            "error_count": 0,
                            "success_rate": None,
                            "error_rate": None,
                            "last_activity": None,
                            "inactive_hours": None,
                            "last_run_time": None,
                            "groups_collected": None,
                            "members_collected": None,
                            "messages_collected": None,
                            "source": "config_directory",
                        }
        logger.info(
            "Avatar discovery: %d from logs, %d config dirs found, %d total",
            len([r for r in results.values() if r.get("source") != "config_directory"]),
            len(discovered_dirs),
            len(results),
        )
    except Exception:
        logger.warning("Failed to list avatar config directories", exc_info=True)

    return results


def check_system_health(ssh_client: paramiko.SSHClient) -> dict:
    """Check disk and memory usage on the scraper VM.

    Args:
        ssh_client: Connected paramiko SSH client.

    Returns:
        Dict with disk and memory usage percentages and raw values.
    """
    result = {"disk": None, "memory": None}

    # Disk check
    try:
        disk_output = _run_ssh_command(
            ssh_client,
            _powershell_encoded('Get-PSDrive C | Select-Object Used,Free | ConvertTo-Csv -NoTypeInformation'),
            timeout=15,
        )
        lines = [l for l in disk_output.splitlines() if l.strip() and not l.startswith("#")]
        if len(lines) >= 2:
            reader = csv.DictReader(io.StringIO("\n".join(lines)))
            for row in reader:
                used = int(row.get("Used", 0).strip('"'))
                free = int(row.get("Free", 0).strip('"'))
                total = used + free
                usage_pct = round((used / total) * 100, 1) if total > 0 else 0
                result["disk"] = {
                    "used_gb": round(used / (1024**3), 1),
                    "free_gb": round(free / (1024**3), 1),
                    "total_gb": round(total / (1024**3), 1),
                    "usage_percent": usage_pct,
                }
                break
    except Exception:
        logger.exception("Failed to check disk usage")
        result["disk"] = {"error": "Failed to check disk usage"}

    # Memory check
    try:
        mem_output = _run_ssh_command(
            ssh_client,
            _powershell_encoded('$os = Get-CimInstance Win32_OperatingSystem; Write-Output "$($os.TotalVisibleMemorySize),$($os.FreePhysicalMemory)"'),
            timeout=15,
        )
        parts = mem_output.strip().split(",")
        if len(parts) == 2:
            total_kb = int(parts[0].strip())
            free_kb = int(parts[1].strip())
            used_kb = total_kb - free_kb
            usage_pct = round((used_kb / total_kb) * 100, 1) if total_kb > 0 else 0
            result["memory"] = {
                "total_gb": round(total_kb / (1024**2), 1),
                "used_gb": round(used_kb / (1024**2), 1),
                "free_gb": round(free_kb / (1024**2), 1),
                "usage_percent": usage_pct,
            }
    except Exception:
        logger.exception("Failed to check memory usage")
        result["memory"] = {"error": "Failed to check memory usage"}

    return result


def _get_local_irisdata_folders(ssh_client: paramiko.SSHClient) -> tuple[int, list[str]]:
    """List directories under C:\\irisdata on the scraper VM.

    Returns:
        Tuple of (folder_count, folder_names_list).
    """
    try:
        folder_cmd = _powershell_encoded(
            'Get-ChildItem "C:\\irisdata" -Directory -ErrorAction SilentlyContinue '
            '| Select-Object -ExpandProperty Name'
        )
        folder_output = _run_ssh_command(ssh_client, folder_cmd, timeout=15)
        local_folders = []
        if folder_output:
            for dirname in folder_output.splitlines():
                dirname = dirname.strip()
                if dirname:
                    local_folders.append(dirname)
        logger.info("Local irisdata folders: %d found", len(local_folders))
        return len(local_folders), local_folders
    except Exception:
        logger.warning("Failed to list local irisdata folders", exc_info=True)
        return 0, []


def check_gcs_sync(ssh_client: paramiko.SSHClient) -> dict:
    """Check the last GCS sync log timestamp.

    Args:
        ssh_client: Connected paramiko SSH client.

    Returns:
        Dict with last_sync_time, staleness information, and local folder counts.
    """
    # Collect local avatar data folder info
    local_folder_count, local_folders = _get_local_irisdata_folders(ssh_client)

    try:
        output = _run_ssh_command(
            ssh_client,
            _powershell_encoded('Get-ChildItem "C:\\projects\\.gcs-sync-logs" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1 Name,LastWriteTime | ConvertTo-Csv -NoTypeInformation'),
            timeout=15,
        )
    except Exception:
        logger.exception("Failed to check GCS sync logs")
        return {
            "error": "Failed to check GCS sync logs via SSH",
            "local_folder_count": local_folder_count,
            "local_folders": local_folders,
        }

    if not output or "Cannot find path" in output:
        return {
            "last_sync_time": None,
            "last_sync_file": None,
            "stale_hours": None,
            "error": "GCS sync log directory not found",
            "local_folder_count": local_folder_count,
            "local_folders": local_folders,
        }

    try:
        lines = [l for l in output.splitlines() if l.strip() and not l.startswith("#")]
        if len(lines) >= 2:
            reader = csv.DictReader(io.StringIO("\n".join(lines)))
            for row in reader:
                name = row.get("Name", "").strip('"')
                last_write = row.get("LastWriteTime", "").strip('"')

                sync_time = None
                for fmt in ("%m/%d/%Y %H:%M:%S", "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S"):
                    try:
                        sync_time = datetime.strptime(last_write, fmt).replace(
                            tzinfo=timezone.utc
                        )
                        break
                    except ValueError:
                        continue

                stale_hours = None
                if sync_time:
                    now = datetime.now(timezone.utc)
                    stale_hours = round(
                        (now - sync_time).total_seconds() / 3600, 1
                    )

                return {
                    "last_sync_time": sync_time.isoformat() if sync_time else last_write,
                    "last_sync_file": name,
                    "stale_hours": stale_hours,
                    "local_folder_count": local_folder_count,
                    "local_folders": local_folders,
                }
    except Exception:
        logger.exception("Failed to parse GCS sync output")

    return {
        "last_sync_time": None,
        "last_sync_file": None,
        "stale_hours": None,
        "error": "Failed to parse GCS sync log output",
        "local_folder_count": local_folder_count,
        "local_folders": local_folders,
    }
