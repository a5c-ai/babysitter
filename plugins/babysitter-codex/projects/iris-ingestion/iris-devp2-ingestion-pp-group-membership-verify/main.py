import os
import json
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Optional, Dict

from google.cloud import storage

from database import MembershipVerifyDB


GCS_BUCKET_NAME = "real_time_ingestion_dev"
MEMBER_BLOB_FILENAMES = ["group_members_All.json", "group_members_all.json"]


def find_member_blob_in_bucket(gcs_client, scrapping_id: str) -> Optional[list]:
    """Search all scrapped folders in the GCS bucket for a group matching scrapping_id.

    The bucket structure is: {scrapped_folder}/{group_display_name}/group_members_All.json
    We iterate scrapped folders (sorted newest first by name) and check group_info.json
    for a matching scrapping_id (stored as 'id' field).
    """
    bucket = gcs_client.bucket(GCS_BUCKET_NAME)

    # List top-level scrapped folders (prefixes)
    iterator = bucket.list_blobs(delimiter='/')
    # Consume the iterator to populate prefixes
    _ = list(iterator)
    prefixes = sorted(list(iterator.prefixes), reverse=True)  # newest first

    for scrapped_folder in prefixes:
        # List group sub-folders within this scrapped folder
        sub_iterator = bucket.list_blobs(prefix=scrapped_folder, delimiter='/')
        _ = list(sub_iterator)
        group_prefixes = list(sub_iterator.prefixes)

        for group_prefix in group_prefixes:
            # Check group_info.json for matching scrapping_id
            info_blob = bucket.blob(f"{group_prefix}group_info.json")
            if not info_blob.exists():
                continue

            try:
                info_content = info_blob.download_as_text()
                info_data = json.loads(info_content)
                group_id_in_blob = info_data.get("id", "")
                if str(group_id_in_blob) != str(scrapping_id):
                    continue

                # Found matching group - try to read member blob
                for filename in MEMBER_BLOB_FILENAMES:
                    member_blob_path = f"{group_prefix}{filename}"
                    member_blob = bucket.blob(member_blob_path)
                    if member_blob.exists():
                        print(f"[MembershipVerify] Found member blob at: {member_blob_path}")
                        content = member_blob.download_as_text()
                        members = json.loads(content)
                        if isinstance(members, list):
                            return members

            except Exception as e:
                print(f"[MembershipVerify] Error checking {group_prefix}: {e}")
                continue

    print(f"[MembershipVerify] No member blob found for scrapping_id: {scrapping_id}")
    return None


def verify_group_membership(group_id: int, db: Optional[MembershipVerifyDB] = None) -> Dict:
    """
    Verify group membership by comparing GCS member blob with database records.

    Steps:
    1. Get group's origin_path from DB
    2. Read member blob from GCS
    3. Get current DB memberships
    4. Compare GCS members vs DB members
    5. Add missing members, mark departed members as left
    6. Recalculate counts for affected entities
    7. Update last_monitoring_time from max timestamp in blob
    """
    if db is None:
        db = MembershipVerifyDB()

    gcs_client = storage.Client()

    # Step 1: Get scrapping_id for the group
    scrapping_id = db.get_group_origin_path(group_id)
    if not scrapping_id:
        print(f"[MembershipVerify] No scrapping_id for group {group_id}, skipping")
        return {"verified": False, "reason": "no_scrapping_id"}

    # Step 2: Search GCS bucket for member blob matching this group
    print(f"[MembershipVerify] Searching GCS for group {group_id} (scrapping_id={scrapping_id})")
    gcs_members = find_member_blob_in_bucket(gcs_client, scrapping_id)
    if gcs_members is None:
        print(f"[MembershipVerify] No GCS member blob for group {group_id}, skipping")
        return {"verified": False, "reason": "no_gcs_data"}

    # Step 3: Get current DB memberships
    db_memberships = db.get_db_memberships(group_id)

    # Step 4: Build comparison sets
    # GCS members keyed by scrapping_id (the "id" field in the blob)
    gcs_member_map = {}
    for member in gcs_members:
        sid = member.get("id")
        if sid:
            gcs_member_map[str(sid)] = member

    gcs_scrapping_ids = set(gcs_member_map.keys())

    # DB members keyed by scrapping_id
    db_member_map = {}
    # Also track member_ids (entity IDs) already in DB to catch cross-source duplicates
    db_member_ids = set()
    for row in db_memberships:
        sid = row.get("scrapping_id")
        if sid:
            db_member_map[str(sid)] = row
        member_id = row.get("member_id")
        if member_id:
            db_member_ids.add(member_id)

    db_scrapping_ids = set(db_member_map.keys())

    # Step 5: Determine adds and removals
    to_add = gcs_scrapping_ids - db_scrapping_ids
    to_remove = db_scrapping_ids - gcs_scrapping_ids
    unchanged = gcs_scrapping_ids & db_scrapping_ids

    added_count = 0
    removed_count = 0
    skipped_non_ingestion = 0
    affected_member_ids = []

    # Batch-check which scrapping_ids to add have matching entities in DB
    entity_lookup = db.batch_lookup_entities_by_scrapping_ids(list(to_add)) if to_add else {}
    missing_entity_sids = to_add - set(entity_lookup.keys())
    found_entity_count = len(to_add) - len(missing_entity_sids)
    if to_add:
        print(f"[MembershipVerify] {found_entity_count} of {len(to_add)} GCS members have matching entities ({len(missing_entity_sids)} missing, will skip)")

    # Add members present in GCS but not in DB
    for sid in to_add:
        if sid in missing_entity_sids:
            continue

        gcs_member = gcs_member_map[sid]
        entity_id = entity_lookup[sid]

        # Skip if this member_id already exists in DB under a different source
        if entity_id in db_member_ids:
            print(f"[MembershipVerify] Member {entity_id} already in group {group_id} (cross-source), skipping add")
            continue

        is_admin = gcs_member.get("isAdmin", False)
        is_superadmin = gcs_member.get("isSuperAdmin", False)

        success = db.add_member(group_id, entity_id, is_admin, is_superadmin)
        if success:
            added_count += 1
            affected_member_ids.append(entity_id)
            db_member_ids.add(entity_id)
            print(f"[MembershipVerify] Added member {entity_id} (scrapping_id={sid}) to group {group_id}")

    # Mark members present in DB but not in GCS as left (Ingestion source only)
    for sid in to_remove:
        db_member = db_member_map[sid]
        source = db_member.get("source", "")
        if source != "Ingestion":
            # Expected for pre-migration data: members added before the source field
            # was standardized may have non-ASCII or legacy source values.
            # These are intentionally skipped — only Ingestion-sourced members are managed here.
            skipped_non_ingestion += 1
            continue

        member_id = db_member["member_id"]
        success = db.mark_member_left(group_id, member_id)
        if success:
            removed_count += 1
            affected_member_ids.append(member_id)
            print(f"[MembershipVerify] Marked member {member_id} (scrapping_id={sid}) as left in group {group_id}")

    if skipped_non_ingestion:
        print(f"[MembershipVerify] Skipped {skipped_non_ingestion} non-Ingestion-sourced members for removal (pre-migration data, expected)")

    # Step 6: Recalculate counts for affected entities
    counts_updated = 0
    if affected_member_ids:
        counts_updated = db.recalculate_counts(group_id, affected_member_ids)

    # Step 7: Update last_monitoring_time from max timestamp in blob
    monitoring_time_updated = False
    timestamps = [m.get("timestamp") for m in gcs_members if m.get("timestamp")]
    if timestamps:
        max_timestamp = max(timestamps)
        monitoring_time_updated = db.update_last_monitoring_time(group_id, max_timestamp)

    result = {
        "verified": True,
        "added": added_count,
        "removed": removed_count,
        "unchanged": len(unchanged),
        "counts_updated": counts_updated,
        "monitoring_time_updated": monitoring_time_updated,
    }

    print(f"[MembershipVerify] Group {group_id} verification complete: {result}")
    return result


class RequestHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        group_id = None
        try:
            content_length = int(self.headers["Content-Length"])
            post_data = self.rfile.read(content_length)
            payload = json.loads(post_data)

            group_id = payload.get("group_id", None)

            db = MembershipVerifyDB()
            result = verify_group_membership(group_id, db=db)

            if result.get("verified"):
                print(f"Membership verification completed for group {group_id}: {result}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "OK",
                    "message": f"Membership verification completed for group {group_id}",
                    "data": result,
                }).encode("utf-8"))
            else:
                reason = result.get("reason", "unknown")
                print(f"Membership verification skipped for group {group_id}: {reason}")

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "SKIPPED",
                    "message": f"Membership verification skipped for group {group_id}: {reason}",
                    "data": result,
                }).encode("utf-8"))

        except Exception as e:
            print(f"Membership verification failed for group {group_id}: {str(e)}")

            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "FAILED",
                "message": f"Membership verification failed for group {group_id}: {str(e)}",
                "data": {},
            }).encode("utf-8"))


def run(server_class=HTTPServer, handler_class=RequestHandler, port=8087):
    server_address = ("", port)
    httpd = server_class(server_address, handler_class)
    print(f"Serving membership-verify on port {port}")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8087))
    run(port=port)
