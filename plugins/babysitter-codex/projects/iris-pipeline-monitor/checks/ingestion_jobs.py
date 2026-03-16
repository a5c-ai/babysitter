"""Cloud Run Job execution checks.

Uses the gcloud CLI to inspect recent executions of ingestion jobs.
Falls back to the Cloud Run v2 REST API if gcloud CLI fails.
"""

import json
import logging
import subprocess
from datetime import datetime, timezone

import google.auth
import google.auth.transport.requests
import requests as http_requests

logger = logging.getLogger("pipeline-monitor.ingestion_jobs")


def _fetch_executions_via_rest_api(
    job_name: str,
    project: str,
    region: str,
    limit: int = 5,
) -> list | None:
    """Fallback: fetch job executions via Cloud Run v2 REST API.

    Returns a list of execution dicts, or None if the request fails.
    """
    try:
        credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)

        parent = f"projects/{project}/locations/{region}/jobs/{job_name}"
        url = f"https://run.googleapis.com/v2/{parent}/executions"
        params = {"pageSize": limit}
        headers = {"Authorization": f"Bearer {credentials.token}"}

        resp = http_requests.get(url, headers=headers, params=params, timeout=30)

        if resp.status_code == 200:
            data = resp.json()
            return data.get("executions", [])
        else:
            logger.warning(
                "Cloud Run REST API returned %d for job %s: %s",
                resp.status_code,
                job_name,
                resp.text[:300],
            )
            return None
    except Exception:
        logger.exception("Failed to fetch executions via REST API for job %s", job_name)
        return None


def check_job_executions(
    job_name: str,
    project: str = "veritas-452309",
    region: str = "me-west1",
) -> dict:
    """Check recent executions of a Cloud Run Job.

    Args:
        job_name: Name of the Cloud Run Job.
        project: GCP project ID.
        region: GCP region.

    Returns:
        Dict with last execution status, time, duration, and recent history.
    """
    cmd = [
        "gcloud", "run", "jobs", "executions", "list",
        f"--job={job_name}",
        f"--region={region}",
        f"--project={project}",
        "--limit=5",
        "--format=json",
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
        )
    except subprocess.TimeoutExpired:
        logger.warning("gcloud command timed out for job %s", job_name)
        return {"error": f"gcloud command timed out for {job_name}"}
    except FileNotFoundError:
        logger.error("gcloud CLI not found")
        return {"error": "gcloud CLI not found on PATH"}
    except Exception:
        logger.exception("Failed to run gcloud for job %s", job_name)
        return {"error": f"Failed to query executions for {job_name}"}

    gcloud_failed = False

    if result.returncode != 0:
        logger.warning(
            "gcloud returned exit code %d for job %s: %s",
            result.returncode,
            job_name,
            result.stderr[:500],
        )
        gcloud_failed = True
        executions = None
    else:
        try:
            executions = json.loads(result.stdout) if result.stdout.strip() else []
        except json.JSONDecodeError:
            logger.exception("Failed to parse gcloud JSON output for job %s", job_name)
            gcloud_failed = True
            executions = None

    # Fallback to REST API if gcloud failed
    if gcloud_failed or executions is None:
        logger.info("Falling back to REST API for job %s", job_name)
        rest_executions = _fetch_executions_via_rest_api(job_name, project, region)
        if rest_executions is not None:
            executions = rest_executions
        elif executions is None:
            return {
                "error": f"Both gcloud and REST API failed for {job_name}",
                "stderr": result.stderr[:500] if result.stderr else "",
            }

    if not executions:
        return {
            "last_execution_time": None,
            "last_status": "never_executed",
            "last_duration_seconds": None,
            "age_hours": None,
            "recent_executions": [],
        }

    recent = []
    now = datetime.now(timezone.utc)

    for execution in executions:
        # Support both gcloud (v1) and REST API (v2) response formats
        metadata = execution.get("metadata", {})
        status_obj = execution.get("status", {})

        # v2 REST API uses top-level fields; v1 gcloud nests under metadata/status
        create_time_raw = (
            execution.get("createTime")
            or metadata.get("creationTimestamp")
            or metadata.get("annotations", {}).get(
                "run.googleapis.com/creationTimestamp", ""
            )
        )

        create_time = None
        if create_time_raw:
            try:
                create_time = datetime.fromisoformat(
                    create_time_raw.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Extract completion time (v2 uses completionTime at top level)
        completion_time_raw = (
            execution.get("completionTime")
            or status_obj.get("completionTime", "")
        )
        completion_time = None
        if completion_time_raw:
            try:
                completion_time = datetime.fromisoformat(
                    completion_time_raw.replace("Z", "+00:00")
                )
            except ValueError:
                pass

        # Determine status from conditions
        conditions = (
            execution.get("conditions")
            or status_obj.get("conditions", [])
        )
        exec_status = "Unknown"
        for cond in conditions:
            if cond.get("type") == "Completed":
                exec_status = "Succeeded" if cond.get("status") == "True" else "Failed"
                break

        # If no Completed condition, check if running
        if exec_status == "Unknown":
            for cond in conditions:
                if cond.get("type") == "Running" and cond.get("status") == "True":
                    exec_status = "Running"
                    break

        # Calculate duration
        duration_seconds = None
        if create_time and completion_time:
            duration_seconds = round(
                (completion_time - create_time).total_seconds()
            )

        # Calculate age
        age_hours = None
        ref_time = completion_time or create_time
        if ref_time:
            age_hours = round((now - ref_time).total_seconds() / 3600, 1)

        # Execution name: v2 uses "name" at top level, v1 under metadata
        exec_name = execution.get("name") or metadata.get("name", "")

        recent.append({
            "name": exec_name,
            "status": exec_status,
            "create_time": create_time.isoformat() if create_time else None,
            "completion_time": completion_time.isoformat() if completion_time else None,
            "duration_seconds": duration_seconds,
            "age_hours": age_hours,
        })

    latest = recent[0] if recent else {}

    return {
        "last_execution_time": latest.get("create_time"),
        "last_status": latest.get("status", "Unknown"),
        "last_duration_seconds": latest.get("duration_seconds"),
        "age_hours": latest.get("age_hours"),
        "recent_executions": recent,
    }
