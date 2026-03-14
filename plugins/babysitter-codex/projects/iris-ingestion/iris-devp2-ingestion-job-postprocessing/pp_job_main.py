"""
Post-Processing Cloud Run Job Entry Point
==========================================
Unified job replacing 7 PP Cloud Run Services:
  1. Group Translation
  2. Member Blacklist
  3. AI Summary
  4. Data Inheritance (called internally by AI Summary)
  5. CallerAPI Enrichment
  6. Activity Timestamp
  7. Membership Verification

Reads group_ids from either:
  - A GCS manifest file (written by the ingestion job)
  - Environment variable PP_GROUP_IDS (comma-separated, for manual runs)

Each group is processed sequentially through all PP steps.
Errors in one group don't block processing of others.
"""

import os
import sys
import json
import time
import signal
import traceback
# Note: ThreadPoolExecutor removed — parallel group processing is NOT safe
# because _enter_svc() modifies global state (sys.modules, sys.path, os.chdir).

# ---------------------------------------------------------------------------
# Credentials setup — Each PP service now handles ADC fallback natively
# (checks os.path.exists(credentials.json) before using it).
# Unset any stale GOOGLE_APPLICATION_CREDENTIALS to ensure ADC is used.
# ---------------------------------------------------------------------------
os.environ.pop('GOOGLE_APPLICATION_CREDENTIALS', None)

# Signal to sub-services that we're running in PP job mode (skip HTTP calls to other services)
os.environ['PP_JOB_MODE'] = 'true'

# ---------------------------------------------------------------------------
# sys.path setup — import each PP service as a library
# ---------------------------------------------------------------------------
INGESTION_BASE = os.environ.get('INGESTION_BASE', '/data/repos/projects/iris-ingestion')

PP_SERVICE_DIRS = {
    'translation': os.environ.get('PP_TRANSLATION_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-translation')),
    'blacklist': os.environ.get('PP_BLACKLIST_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-member-blacklist')),
    'ai_summary': os.environ.get('PP_AI_SUMMARY_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-ai-summary')),
    'data_inheritance': os.environ.get('PP_DATA_INHERITANCE_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-data-inheritance')),
    'callerapi': os.environ.get('PP_CALLERAPI_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-callerapi-enrichment')),
    'timestamp': os.environ.get('PP_TIMESTAMP_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-activity-timestamp')),
    'membership_verify': os.environ.get('PP_MEMBERSHIP_VERIFY_DIR',
        os.path.join(INGESTION_BASE, 'iris-devp2-ingestion-pp-group-membership-verify')),
}

# ---------------------------------------------------------------------------
# GCS manifest reading
# ---------------------------------------------------------------------------
def read_manifest_from_gcs(manifest_uri):
    """Read a manifest JSON file from GCS."""
    from google.cloud import storage as gcs_storage
    if manifest_uri.startswith('gs://'):
        manifest_uri = manifest_uri[5:]
    bucket_name, blob_path = manifest_uri.split('/', 1)
    client = gcs_storage.Client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(blob_path)
    content = blob.download_as_text()
    return json.loads(content)


def resolve_group_ids(raw_ids):
    """Resolve a list of raw group IDs into validated entity PKs.

    Old manifests store scrapping_ids instead of DB PKs — both numeric
    (Telegram chat IDs like '2407145263') and non-numeric (WhatsApp IDs
    like '120363210966231321@g.us').  This function validates ALL IDs
    against the DB: numeric IDs are checked as entity PKs first; if not
    found, they're looked up by scrapping_id.  Non-numeric IDs go
    straight to scrapping_id lookup.
    """
    import psycopg

    if not raw_ids:
        return []

    numeric_candidates = []   # (raw_str, int_val) — might be PK or Telegram chat ID
    non_numeric = []           # definitely needs scrapping_id lookup

    for raw in raw_ids:
        raw_str = str(raw).strip()
        if not raw_str:
            continue
        if raw_str.isdigit():
            numeric_candidates.append((raw_str, int(raw_str)))
        else:
            try:
                numeric_candidates.append((raw_str, int(raw_str)))
            except (ValueError, TypeError):
                non_numeric.append(raw_str)

    # Load DB config
    db_config_path = os.path.join(
        os.path.dirname(os.path.abspath(__file__)), 'configs', 'db.json'
    )
    if not os.path.exists(db_config_path):
        db_config_path = os.path.join(
            os.environ.get('INGESTION_BASE', '/data/repos/projects/iris-ingestion'),
            'pp-group-translation', 'configs', 'db.json'
        )
    if not os.path.exists(db_config_path):
        db_config_path = os.path.join(
            os.environ.get('INGESTION_BASE', '/data/repos/projects/iris-ingestion'),
            'iris-devp2-ingestion-pp-group-translation', 'configs', 'db.json'
        )

    with open(db_config_path, 'r') as f:
        db_json = json.load(f)

    env_type = db_json.get('environment_type', 'local')
    default_cfg = db_json.get('default_config', 'stagingV2_db_config')
    cfg = db_json.get(env_type, db_json.get('local', {})).get(default_cfg, {})

    resolved = []
    conn = None
    try:
        conn = psycopg.connect(
            host=cfg['db_host'],
            port=cfg.get('db_port', 5432),
            user=cfg['db_user'],
            password=cfg['db_password'],
            dbname=cfg['db_name'],
            connect_timeout=cfg.get('connect_timeout', 60),
        )
        cur = conn.cursor()

        # --- Validate numeric IDs: check if they exist as entity PKs ---
        for raw_str, int_val in numeric_candidates:
            try:
                cur.execute(
                    "SELECT id FROM entities WHERE id = %s AND type = 'group' AND status != '5' LIMIT 1",
                    (int_val,),
                )
                row = cur.fetchone()
                if row:
                    resolved.append(int(row[0]))
                    continue
                # Not a valid PK — try scrapping_id lookup (e.g. Telegram chat ID)
                cur.execute(
                    "SELECT id FROM entities WHERE type = 'group' AND scrapping_id = %s AND status != '5' LIMIT 1",
                    (raw_str,),
                )
                row = cur.fetchone()
                if row:
                    resolved.append(int(row[0]))
                    print(f"[PP] Resolved numeric scrapping_id '{raw_str}' -> entity PK {row[0]}")
                else:
                    print(f"[PP] WARNING: Numeric ID '{raw_str}' is not a valid entity PK or scrapping_id, skipping")
            except Exception as e:
                print(f"[PP] WARNING: DB lookup failed for numeric ID '{raw_str}': {e}")

        # --- Look up non-numeric IDs by scrapping_id ---
        for scrapping_id in non_numeric:
            try:
                cur.execute(
                    "SELECT id FROM entities WHERE type = 'group' AND scrapping_id = %s AND status != '5' LIMIT 1",
                    (scrapping_id,),
                )
                row = cur.fetchone()
                if row:
                    resolved.append(int(row[0]))
                    print(f"[PP] Resolved scrapping_id '{scrapping_id}' -> entity PK {row[0]}")
                else:
                    print(f"[PP] WARNING: Could not resolve scrapping_id '{scrapping_id}' — no matching entity found, skipping")
            except Exception as e:
                print(f"[PP] WARNING: DB lookup failed for scrapping_id '{scrapping_id}': {e}")

        cur.close()
    except Exception as e:
        print(f"[PP] ERROR: Could not connect to DB for group ID resolution: {e}")
        print(f"[PP] WARNING: {len(raw_ids)} group IDs could not be validated")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass

    print(f"[PP] Resolved {len(resolved)}/{len(raw_ids)} group IDs to valid entity PKs")
    return resolved


def get_group_ids():
    """Get group IDs to post-process from manifest or env var."""
    # Option 1: Manifest URI from env
    manifest_uri = os.environ.get('PP_MANIFEST_URI')
    if manifest_uri:
        print(f"Reading manifest from: {manifest_uri}")
        manifest = read_manifest_from_gcs(manifest_uri)
        group_ids = manifest.get('group_ids', [])
        print(f"Manifest contains {len(group_ids)} groups")
        return resolve_group_ids(group_ids)

    # Option 2: Comma-separated group IDs from env
    group_ids_str = os.environ.get('PP_GROUP_IDS', '')
    if group_ids_str:
        group_ids = [gid.strip() for gid in group_ids_str.split(',') if gid.strip()]
        print(f"Processing {len(group_ids)} groups from PP_GROUP_IDS env var")
        return resolve_group_ids(group_ids)

    # Option 3: Find latest manifest in GCS
    manifest_bucket = os.environ.get('PP_MANIFEST_BUCKET', 'iris_devp2_ingestion_logs')
    manifest_prefix = os.environ.get('PP_MANIFEST_PREFIX', 'manifests/')
    print(f"Searching for latest manifest in gs://{manifest_bucket}/{manifest_prefix}")
    from google.cloud import storage as gcs_storage
    client = gcs_storage.Client()
    bucket = client.bucket(manifest_bucket)
    blobs = list(bucket.list_blobs(prefix=manifest_prefix))
    if not blobs:
        print("No manifests found. Nothing to process.")
        return []
    # Sort by time_created descending, pick latest
    blobs.sort(key=lambda b: b.time_created, reverse=True)
    latest = blobs[0]
    print(f"Using latest manifest: gs://{manifest_bucket}/{latest.name}")
    content = latest.download_as_text()
    manifest = json.loads(content)
    group_ids = manifest.get('group_ids', [])
    print(f"Manifest contains {len(group_ids)} groups")
    return resolve_group_ids(group_ids)


# ---------------------------------------------------------------------------
# PP Step runners — each adds the service dir to sys.path, imports, and runs.
# os.chdir() is used so that relative config paths (configs/db.json etc.)
# resolve correctly within each service.
#
# IMPORTANT: Each service has identically-named modules (database, main,
# helpers, logs, storage).  We must purge them from sys.modules between
# steps so Python re-imports from the correct service directory.
# ---------------------------------------------------------------------------
import importlib

_original_cwd = os.getcwd()

# Module names shared across PP services that must be purged between steps.
_SHARED_MODULE_NAMES = [
    'database', 'main', 'helper', 'helpers', 'logs', 'storage',
    'utils', 'utils.helper',
]

def _enter_svc(svc_dir):
    """Add service dir to sys.path front, chdir into it, and purge cached modules."""
    # Purge shared module names so imports resolve from the new svc_dir
    for mod_name in list(sys.modules):
        if mod_name in _SHARED_MODULE_NAMES or mod_name.startswith('utils.'):
            del sys.modules[mod_name]
    sys.path.insert(0, svc_dir)
    os.chdir(svc_dir)

def _exit_svc(svc_dir):
    """Remove service dir from sys.path and restore original cwd."""
    if svc_dir in sys.path:
        sys.path.remove(svc_dir)
    os.chdir(_original_cwd)


class _NoOpWFile:
    """Shim for wfile.write() calls in HTTP handler methods."""
    def write(self, data): pass

class _NoOpHTTPHandler:
    """Shim so that RequestHandler methods that call self.send_response() etc.
    don't crash when invoked outside an actual HTTP context."""
    def __init__(self):
        self.wfile = _NoOpWFile()
    def send_response(self, *a, **kw): pass
    def send_header(self, *a, **kw): pass
    def end_headers(self, *a, **kw): pass
    def send_error_response(self, status_code, message):
        print(f"[PP-shim] Error {status_code}: {message}")
    def send_success_response(self, message, data=None):
        print(f"[PP-shim] Success: {message}")

_noop = _NoOpHTTPHandler()

def _patch_handler(handler):
    """Inject no-op HTTP methods into a RequestHandler instance."""
    handler.wfile = _NoOpWFile()
    handler.send_response = lambda *a, **kw: None
    handler.send_header = lambda *a, **kw: None
    handler.end_headers = lambda *a, **kw: None
    handler.send_error_response = _noop.send_error_response
    handler.send_success_response = _noop.send_success_response
    return handler


def run_translation(group_id, logger_info):
    """Step 1: Translate group name and bio."""
    svc_dir = PP_SERVICE_DIRS['translation']
    _enter_svc(svc_dir)
    try:
        from database import DatabaseConnector
        from logs import IngestionLogger

        db = DatabaseConnector()
        logger = IngestionLogger(session_id=logger_info['session_id'])

        from main import RequestHandler
        handler = RequestHandler.__new__(RequestHandler)
        _patch_handler(handler)
        handler.log_and_respond_error = lambda *a, **kw: print(f"[PP] Translation error: {a[3] if len(a) > 3 else a}")
        handler.log_success = lambda *a, **kw: print(f"[PP] Translation: {a[3] if len(a) > 3 else a}")
        handler.log_info = lambda *a, **kw: print(f"[PP] Translation info: {a[3] if len(a) > 3 else a}")

        result = handler.process_group_translation(str(group_id), db, logger)
        return {"step": "translation", "group_id": group_id, "success": bool(result), "result": str(result)}
    except Exception as e:
        return {"step": "translation", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


def run_blacklist(group_id, logger_info):
    """Step 2: Check and mark blacklisted members."""
    svc_dir = PP_SERVICE_DIRS['blacklist']
    _enter_svc(svc_dir)
    try:
        from database import DatabaseConnector
        from logs import IngestionLogger
        from helpers import read_config_file, hash_md5
        from storage import read_json_from_blob

        db = DatabaseConnector()
        logger = IngestionLogger(session_id=logger_info['session_id'])

        group_details = db.fetch_group_details(str(group_id))
        if not group_details:
            return {"step": "blacklist", "group_id": group_id, "success": False, "error": "Group not found"}

        app_type = group_details.get('app_type')
        group_application_type = app_type if isinstance(app_type, str) else (app_type[0] if app_type else None)
        blacklist_file_map = {
            'telegram': 'blacklists/blacklist_telegram.json',
            'whatsapp': 'blacklists/blacklist_whatsapp.json',
            'zalo': 'blacklists/blacklist_zalo.json',
        }
        blacklist_blob = blacklist_file_map.get(group_application_type, 'blacklists/blacklist_whatsapp.json')

        generic_config = read_config_file("generic_config.json")
        bucket_name = generic_config.get('blacklist_storage_bucket', 'iris_devp2_ingestion_logs')
        blacklisted_entities = read_json_from_blob(bucket_name, blacklist_blob)
        if not blacklisted_entities:
            blacklisted_entities = []

        success = db.blacklist_group_entities_and_related_data(str(group_id), blacklisted_entities)
        return {"step": "blacklist", "group_id": group_id, "success": success}
    except Exception as e:
        return {"step": "blacklist", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


def run_ai_summary(group_id, logger_info):
    """Step 3: Generate AI summary (also triggers data inheritance internally)."""
    svc_dir = PP_SERVICE_DIRS['ai_summary']
    _enter_svc(svc_dir)
    try:
        from database import DatabaseConnector
        from logs import IngestionLogger

        db = DatabaseConnector()
        logger = IngestionLogger(session_id=logger_info['session_id'])

        from main import RequestHandler
        handler = RequestHandler.__new__(RequestHandler)
        _patch_handler(handler)

        result = handler.generate_ai_summary_for_groups(db, str(group_id), logger)
        success = result is not None
        return {"step": "ai_summary", "group_id": group_id, "success": success, "result": str(result)}
    except Exception as e:
        return {"step": "ai_summary", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


def run_data_inheritance(group_id, logger_info):
    """Step 4: Propagate AI data to related entities (backup — AI summary normally does this)."""
    svc_dir = PP_SERVICE_DIRS['data_inheritance']
    _enter_svc(svc_dir)
    try:
        from database import DatabaseConnector
        from logs import IngestionLogger

        db = DatabaseConnector()
        logger = IngestionLogger(session_id=logger_info['session_id'])

        from main import RequestHandler
        handler = RequestHandler.__new__(RequestHandler)
        _patch_handler(handler)

        result = handler.inherit_ai_summary_for_groups(db, str(group_id), logger)
        success = result is not None
        return {"step": "data_inheritance", "group_id": group_id, "success": success, "result": str(result)}
    except Exception as e:
        return {"step": "data_inheritance", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


def run_activity_timestamp(group_id, logger_info):
    """Step 5: Update last activity timestamps."""
    svc_dir = PP_SERVICE_DIRS['timestamp']
    _enter_svc(svc_dir)
    try:
        from database import DatabaseConnector
        from logs import IngestionLogger

        db = DatabaseConnector()
        logger = IngestionLogger(session_id=logger_info['session_id'])

        success = db.update_last_active_timestamps_for_group_and_members(str(group_id))
        return {"step": "activity_timestamp", "group_id": group_id, "success": success}
    except Exception as e:
        return {"step": "activity_timestamp", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


def run_membership_verify(group_id, logger_info):
    """Step 6: Verify group membership against GCS member blob."""
    svc_dir = PP_SERVICE_DIRS['membership_verify']
    _enter_svc(svc_dir)
    try:
        from database import MembershipVerifyDB
        from main import verify_group_membership

        db = MembershipVerifyDB()
        result = verify_group_membership(int(group_id), db=db)
        success = result.get('verified', False)
        return {"step": "membership_verify", "group_id": group_id, "success": success, "result": str(result)}
    except Exception as e:
        return {"step": "membership_verify", "group_id": group_id, "success": False, "error": str(e)}
    finally:
        _exit_svc(svc_dir)


# ---------------------------------------------------------------------------
# Per-group pipeline
# ---------------------------------------------------------------------------

def process_group(group_id, session_id):
    """Run all PP steps for a single group, in order."""
    logger_info = {'session_id': session_id}
    results = []
    start = time.time()

    print(f"\n{'='*60}")
    print(f"[PP] Processing group {group_id}")
    print(f"{'='*60}")

    # Step 1: Translation (independent)
    print(f"[PP] [{group_id}] Step 1/6: Translation")
    r = run_translation(group_id, logger_info)
    results.append(r)
    print(f"[PP] [{group_id}] Translation: {'OK' if r['success'] else 'FAILED: ' + r.get('error', '')}")

    # Step 2: Blacklist (independent)
    print(f"[PP] [{group_id}] Step 2/6: Blacklist")
    r = run_blacklist(group_id, logger_info)
    results.append(r)
    print(f"[PP] [{group_id}] Blacklist: {'OK' if r['success'] else 'FAILED: ' + r.get('error', '')}")

    # Step 3: AI Summary (triggers data inheritance internally)
    print(f"[PP] [{group_id}] Step 3/6: AI Summary + Data Inheritance")
    r = run_ai_summary(group_id, logger_info)
    results.append(r)
    print(f"[PP] [{group_id}] AI Summary: {'OK' if r['success'] else 'FAILED: ' + r.get('error', '')}")

    # Step 4: Data inheritance (always runs — propagates group classification to members)
    # In PP_JOB_MODE, AI summary skips the inheritance HTTP call, so we must
    # always run it here to ensure members get group classifications. (IR-807)
    print(f"[PP] [{group_id}] Step 4/6: Data Inheritance")
    r = run_data_inheritance(group_id, logger_info)
    results.append(r)
    print(f"[PP] [{group_id}] Data Inheritance: {'OK' if r['success'] else 'FAILED: ' + r.get('error', '')}")

    # Step 5: Activity Timestamp (independent)
    print(f"[PP] [{group_id}] Step 5/6: Activity Timestamp")
    r = run_activity_timestamp(group_id, logger_info)
    results.append(r)
    print(f"[PP] [{group_id}] Activity Timestamp: {'OK' if r['success'] else 'FAILED: ' + r.get('error', '')}")

    # Step 6: Membership Verification (non-fatal — don't block group on failure)
    print(f"[PP] [{group_id}] Step 6/6: Membership Verification")
    try:
        r = run_membership_verify(group_id, logger_info)
        results.append(r)
        print(f"[PP] [{group_id}] Membership Verification: {'OK' if r['success'] else 'SKIPPED/FAILED: ' + r.get('error', r.get('result', ''))}")
    except Exception as e:
        print(f"[PP] [{group_id}] Membership Verification: FAILED (non-fatal): {e}")
        results.append({"step": "membership_verify", "group_id": group_id, "success": False, "error": str(e)})

    duration = time.time() - start
    successes = sum(1 for r in results if r['success'])
    total = len(results)

    print(f"[PP] [{group_id}] Completed in {duration:.1f}s ({successes}/{total} steps succeeded)")
    return {
        "group_id": group_id,
        "duration": round(duration, 2),
        "steps_succeeded": successes,
        "steps_total": total,
        "results": results
    }


# ---------------------------------------------------------------------------
# Per-group timeout support (Linux signal-based)
# ---------------------------------------------------------------------------

class GroupTimeoutError(Exception):
    pass

def _timeout_handler(signum, frame):
    raise GroupTimeoutError("Group processing timed out")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    import uuid
    session_id = f"pp-job-{time.strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:8]}"

    print(f"=" * 70)
    print(f"Post-Processing Job Starting")
    print(f"Session: {session_id}")
    print(f"=" * 70)

    start_time = time.time()

    # Get group IDs to process
    group_ids = get_group_ids()
    if not group_ids:
        print("No groups to post-process. Exiting.")
        sys.exit(0)

    print(f"\nProcessing {len(group_ids)} groups: {group_ids}")

    # Process groups sequentially — parallel is NOT safe because _enter_svc()
    # modifies global state (sys.modules, sys.path, os.chdir) which races
    # across threads.
    all_results = []

    for i, gid in enumerate(group_ids, 1):
        elapsed = time.time() - start_time
        if elapsed > 6000:  # 100 min guard, well under 7200s Cloud Run limit
            print(f"[PP] Job time limit reached ({elapsed:.0f}s). Processed {i-1}/{len(group_ids)} groups. Remaining will be picked up next run.")
            break
        print(f"\n[PP] === Group {i}/{len(group_ids)} ===")
        try:
            old_handler = signal.signal(signal.SIGALRM, _timeout_handler)
            signal.alarm(300)  # 5 min per group
            result = process_group(gid, session_id)
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)
            all_results.append(result)
        except GroupTimeoutError:
            signal.alarm(0)
            print(f"[PP] [{gid}] TIMEOUT: Group processing exceeded 300s, skipping")
            all_results.append({
                "group_id": gid,
                "duration": 0,
                "steps_succeeded": 0,
                "steps_total": 0,
                "error": "timeout"
            })
        except Exception as e:
            signal.alarm(0)
            print(f"[PP] Group {gid} failed with exception: {e}")
            traceback.print_exc()
            all_results.append({
                "group_id": gid,
                "duration": 0,
                "steps_succeeded": 0,
                "steps_total": 0,
                "error": str(e)
            })

    # Summary
    total_duration = time.time() - start_time
    total_groups = len(all_results)
    successful_groups = sum(1 for r in all_results if r.get('steps_total', 0) > 0 and r.get('steps_succeeded', 0) == r.get('steps_total', 0))
    partial_groups = sum(1 for r in all_results if 0 < r.get('steps_succeeded', 0) < r.get('steps_total', 1))
    failed_groups = total_groups - successful_groups - partial_groups

    print(f"\n{'='*70}")
    print(f"Post-Processing Job Complete")
    print(f"  Session: {session_id}")
    print(f"  Duration: {total_duration:.1f}s")
    print(f"  Groups: {total_groups} total, {successful_groups} fully succeeded, {partial_groups} partial, {failed_groups} failed")
    print(f"{'='*70}")

    if failed_groups > 0:
        print(f"\nWARNING: {failed_groups} groups had failures")
        for r in all_results:
            if r.get('error') or r.get('steps_succeeded', 0) == 0:
                print(f"  - Group {r['group_id']}: {r.get('error', 'all steps failed')}")
        # Exit with error if ALL groups failed
        if successful_groups == 0 and partial_groups == 0:
            sys.exit(1)

    sys.exit(0)


if __name__ == '__main__':
    main()
