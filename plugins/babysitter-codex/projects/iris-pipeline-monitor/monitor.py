#!/usr/bin/env python3
"""Collection Pipeline Monitor - Runs every 10min as Cloud Run Job.
Checks scraper VM health, GCS buckets, and ingestion jobs.
Uploads status report to GCS. Sends alerts via Resend email.
"""

import json
import logging
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import paramiko
from google.cloud import storage

from alerting import evaluate_alerts
from checks.gcs_buckets import (
    check_archive_freshness,
    check_pending_folders,
    check_recent_errors,
    check_tracker_status,
)
from checks.ingestion_jobs import check_job_executions
from checks.scraper_vm import (
    check_avatar_health,
    check_gcs_sync,
    check_scheduled_tasks,
    check_system_health,
)
from notifier import send_alert
from report import compile_report

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
logger = logging.getLogger("pipeline-monitor")

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "configs", "monitor_config.json")
NOTIFICATION_CONFIG_PATH = os.path.join(
    os.path.dirname(__file__), "configs", "notification_config.json"
)


def load_config(path: str) -> dict:
    """Load a JSON configuration file."""
    with open(path, "r", encoding="utf-8") as fh:
        return json.loads(fh.read())


def _create_ssh_client(vm_config: dict) -> paramiko.SSHClient | None:
    """Create and return an SSH client connected to the scraper VM.

    Returns None if the connection fails.
    """
    ssh_key_path = os.environ.get("SSH_KEY_PATH", "/secrets/ssh-key")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        pkey = paramiko.Ed25519Key.from_private_key_file(ssh_key_path)
        client.connect(
            hostname=vm_config["host"],
            port=vm_config.get("port", 22),
            username=vm_config.get("user", "iris"),
            pkey=pkey,
            timeout=30,
            banner_timeout=30,
        )
        logger.info("SSH connection established to %s", vm_config["host"])
        return client
    except Exception:
        logger.exception("Failed to connect via SSH to %s", vm_config["host"])
        return None


def _run_scraper_vm_checks(
    vm_config: dict,
) -> dict:
    """Run all scraper VM checks over a single SSH session."""
    ssh_client = _create_ssh_client(vm_config)
    ssh_failed = ssh_client is None

    results: dict = {
        "ssh_reachable": not ssh_failed,
        "scheduled_tasks": None,
        "avatar_health": None,
        "system_metrics": None,
        "gcs_sync": None,
    }

    if ssh_failed:
        logger.warning("Skipping all scraper VM checks - SSH unreachable")
        return results

    try:
        with ThreadPoolExecutor(max_workers=4) as pool:
            futures = {
                pool.submit(check_scheduled_tasks, ssh_client): "scheduled_tasks",
                pool.submit(
                    check_avatar_health,
                    ssh_client,
                    vm_config.get("scraper_log_path", r"C:\irisdata\lOGS"),
                ): "avatar_health",
                pool.submit(check_system_health, ssh_client): "system_metrics",
                pool.submit(check_gcs_sync, ssh_client): "gcs_sync",
            }
            for future in as_completed(futures, timeout=120):
                key = futures[future]
                try:
                    results[key] = future.result()
                except Exception:
                    logger.exception("Scraper VM check '%s' failed", key)
                    results[key] = {"error": f"Check '{key}' raised an exception"}
    finally:
        ssh_client.close()
        logger.info("SSH connection closed")

    return results


def _run_gcs_checks(config: dict) -> dict:
    """Run all GCS bucket checks."""
    gcs_client = storage.Client()
    buckets = config["buckets"]

    results: dict = {
        "pending_folders": None,
        "tracker_status": None,
        "recent_errors": None,
        "archive_freshness": None,
    }

    check_fns = {
        "pending_folders": lambda: check_pending_folders(
            gcs_client, buckets["scrapped_data"]
        ),
        "tracker_status": lambda: check_tracker_status(
            gcs_client, buckets["scrapped_data"]
        ),
        "recent_errors": lambda: check_recent_errors(gcs_client, buckets["logs"]),
        "archive_freshness": lambda: check_archive_freshness(
            gcs_client, buckets["archive"]
        ),
    }

    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(fn): key for key, fn in check_fns.items()}
        for future in as_completed(futures, timeout=120):
            key = futures[future]
            try:
                results[key] = future.result()
            except Exception:
                logger.exception("GCS check '%s' failed", key)
                results[key] = {"error": f"Check '{key}' raised an exception"}

    return results


def _run_ingestion_job_checks(config: dict) -> dict:
    """Run ingestion job execution checks."""
    job_names = config.get("ingestion_jobs", [])
    project = config.get("gcp_project", "veritas-452309")
    region = config.get("region", "me-west1")

    results: dict = {}

    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {
            pool.submit(check_job_executions, job, project, region): job
            for job in job_names
        }
        for future in as_completed(futures, timeout=120):
            job = futures[future]
            try:
                results[job] = future.result()
            except Exception:
                logger.exception("Job check for '%s' failed", job)
                results[job] = {"error": f"Check for job '{job}' raised an exception"}

    return results


def _upload_status_report(report: dict, config: dict) -> None:
    """Upload the status report to GCS as latest.json and a timestamped copy."""
    gcs_config = config.get("status_gcs_path", {})
    bucket_name = gcs_config.get("bucket", "iris_devp2_ingestion_logs")
    latest_path = gcs_config.get("latest", "pipeline-monitor/latest.json")
    history_prefix = gcs_config.get("history_prefix", "pipeline-monitor/history")

    try:
        client = storage.Client()
        bucket = client.bucket(bucket_name)

        report_json = json.dumps(report, indent=2, default=str)

        # Upload latest.json
        latest_blob = bucket.blob(latest_path)
        latest_blob.upload_from_string(report_json, content_type="application/json")
        logger.info("Uploaded latest report to gs://%s/%s", bucket_name, latest_path)

        # Upload timestamped copy
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H%M%SZ")
        history_path = f"{history_prefix}/{ts}.json"
        history_blob = bucket.blob(history_path)
        history_blob.upload_from_string(report_json, content_type="application/json")
        logger.info(
            "Uploaded history report to gs://%s/%s", bucket_name, history_path
        )
    except Exception:
        logger.exception("Failed to upload status report to GCS")


def main() -> None:
    """Main entry point for the pipeline monitor."""
    start_time = time.monotonic()
    logger.info("Pipeline monitor starting")

    # Load config
    try:
        config = load_config(CONFIG_PATH)
    except Exception:
        logger.exception("Failed to load config from %s", CONFIG_PATH)
        config = {}

    try:
        notification_config = load_config(NOTIFICATION_CONFIG_PATH)
    except Exception:
        logger.exception(
            "Failed to load notification config from %s", NOTIFICATION_CONFIG_PATH
        )
        notification_config = {}

    # Run all check groups in parallel
    scraper_vm_results: dict = {}
    gcs_results: dict = {}
    job_results: dict = {}

    with ThreadPoolExecutor(max_workers=3) as pool:
        future_vm = pool.submit(
            _run_scraper_vm_checks, config.get("scraper_vm", {})
        )
        future_gcs = pool.submit(_run_gcs_checks, config)
        future_jobs = pool.submit(_run_ingestion_job_checks, config)

        for future, name, target in [
            (future_vm, "scraper_vm", None),
            (future_gcs, "gcs", None),
            (future_jobs, "ingestion_jobs", None),
        ]:
            try:
                result = future.result(timeout=180)
                if name == "scraper_vm":
                    scraper_vm_results = result
                elif name == "gcs":
                    gcs_results = result
                else:
                    job_results = result
            except Exception:
                logger.exception("Check group '%s' failed entirely", name)

    # Compile report
    status_report = compile_report(scraper_vm_results, gcs_results, job_results)

    # Upload to GCS
    _upload_status_report(status_report, config)

    # Evaluate alerts
    alerts = evaluate_alerts(status_report, config)

    # Send notifications if needed
    critical_alerts = [a for a in alerts if a.get("severity") == "critical"]
    warning_alerts = [a for a in alerts if a.get("severity") == "warning"]

    if critical_alerts or warning_alerts:
        logger.info(
            "Alerts triggered: %d critical, %d warning",
            len(critical_alerts),
            len(warning_alerts),
        )
        try:
            send_alert(alerts, status_report, notification_config)
        except Exception:
            logger.exception("Failed to send alert notification")
    else:
        logger.info("All checks passed - no alerts")

    elapsed = time.monotonic() - start_time
    logger.info("Pipeline monitor completed in %.1fs", elapsed)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        logger.exception("Unhandled exception in pipeline monitor")
    # Always exit 0 - this is a monitoring job, not the service itself
    sys.exit(0)
