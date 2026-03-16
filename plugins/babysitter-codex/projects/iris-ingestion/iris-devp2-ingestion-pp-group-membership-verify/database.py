import json
import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool
from typing import Optional, List, Dict


class MembershipVerifyDB:
    def __init__(self, config_path="configs/db.json", pool_size: int = 20):
        try:
            with open(config_path, "r") as f:
                all_configs = json.load(f)

            config_key = all_configs.get("default_config")
            print(config_key)
            if not config_key:
                raise RuntimeError("No config_key provided and no 'default_config' found in db.json")

            config_environment = all_configs.get("environment_type")
            print(config_environment)
            if not config_environment:
                raise RuntimeError("No config_environment provided and no 'environment_type' found in db.json")

            creds = all_configs[config_environment][config_key]

            self.dbname = creds["db_name"]
            self.user = creds["db_user"]
            self.password = creds["db_password"]
            self.host = creds["db_host"]
            self.port = creds["db_port"]
            self.connect_timeout = creds.get("connect_timeout", 60)

            dsn = (
                f"dbname={self.dbname} user={self.user} password={self.password} "
                f"host={self.host} port={self.port} connect_timeout={self.connect_timeout} "
                f"options='-c statement_timeout=300000'"
            )

            self.pool = ConnectionPool(
                conninfo=dsn,
                min_size=1,
                max_size=pool_size,
                timeout=30,
                max_lifetime=60 * 30,
                max_idle=60,
            )

        except FileNotFoundError:
            raise RuntimeError(f"Database config file not found: {config_path}")
        except KeyError as e:
            raise RuntimeError(f"Missing database config key: {e}")
        except Exception as e:
            raise RuntimeError(f"Failed to load database config: {e}")

    def get_db_connection(self):
        return psycopg.connect(
            dbname=self.dbname,
            user=self.user,
            password=self.password,
            host=self.host,
            port=self.port,
            connect_timeout=self.connect_timeout,
            autocommit=True,
            options='-c statement_timeout=300000'
        )

    def get_group_origin_path(self, group_id: int) -> Optional[str]:
        """Get the GCS origin_path (scrapping_id) for a group from the entities table."""
        try:
            with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT e.scrapping_id
                    FROM entities e
                    WHERE e.id = %s AND e.status = '1'
                """
                cur.execute(query, (group_id,))
                result = cur.fetchone()

                if not result:
                    print(f"[MembershipVerifyDB] No entity found for group {group_id}")
                    return None

                scrapping_id = result.get("scrapping_id")
                if scrapping_id and scrapping_id.strip():
                    return scrapping_id.strip()

                print(f"[MembershipVerifyDB] No scrapping_id for group {group_id}")
                return None

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to get origin_path for group {group_id}: {e}")
            return None

    def get_db_memberships(self, group_id: int) -> List[Dict]:
        """Get current active memberships for a group from the database."""
        try:
            with self.pool.connection() as conn, conn.cursor(row_factory=dict_row) as cur:
                query = """
                    SELECT gm.member_id, e.scrapping_id, gm.membership_status, gm.source
                    FROM group_memberships gm
                    JOIN entities e ON gm.member_id = e.id
                    WHERE gm.group_id = %s AND gm.status = '1'
                """
                cur.execute(query, (group_id,))
                results = cur.fetchall()
                return results if results else []

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to get memberships for group {group_id}: {e}")
            return []

    def add_member(self, group_id: int, member_entity_id: int, is_admin: bool, is_superadmin: bool) -> bool:
        """Add a new membership record for a member in a group."""
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                # Pre-check: skip if (group_id, member_id) already exists with status='1'
                cur.execute(
                    "SELECT 1 FROM group_memberships WHERE group_id = %s AND member_id = %s AND status = '1' LIMIT 1",
                    (group_id, member_entity_id),
                )
                if cur.fetchone():
                    print(f"[MembershipVerifyDB] Membership already exists for member {member_entity_id} in group {group_id}, skipping insert")
                    return False

                query = """
                    INSERT INTO group_memberships (
                        group_id, member_id, membership_status, status,
                        is_admin, is_superadmin, source
                    )
                    VALUES (%s, %s, '1', '1', %s, %s, 'maintenance_verify')
                """
                cur.execute(query, (
                    group_id,
                    member_entity_id,
                    is_admin,
                    is_superadmin,
                ))
                return True

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to add member {member_entity_id} to group {group_id}: {e}")
            return False

    def mark_member_left(self, group_id: int, member_id: int) -> bool:
        """Mark a member as having left the group. Only affects Ingestion-sourced memberships."""
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                query = """
                    UPDATE group_memberships
                    SET membership_status = '3', status = '0', left_at = NOW()
                    WHERE group_id = %s AND member_id = %s
                    AND status = '1' AND source = 'Ingestion'
                """
                cur.execute(query, (group_id, member_id))
                return cur.rowcount > 0

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to mark member {member_id} as left in group {group_id}: {e}")
            return False

    def lookup_entity_by_scrapping_id(self, scrapping_id: str) -> Optional[int]:
        """Look up an entity ID by its scrapping_id."""
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                query = """
                    SELECT id FROM entities
                    WHERE scrapping_id = %s AND status = '1'
                    LIMIT 1
                """
                cur.execute(query, (scrapping_id,))
                result = cur.fetchone()
                return result[0] if result else None

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to look up entity for scrapping_id {scrapping_id}: {e}")
            return None

    def batch_lookup_entities_by_scrapping_ids(self, scrapping_ids: List[str]) -> Dict[str, int]:
        """Batch look up entity IDs by their scrapping_ids. Returns a dict of scrapping_id -> entity_id."""
        if not scrapping_ids:
            return {}
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                query = """
                    SELECT scrapping_id, id FROM entities
                    WHERE scrapping_id = ANY(%s) AND status = '1'
                """
                cur.execute(query, (list(scrapping_ids),))
                results = cur.fetchall()
                return {str(row[0]): row[1] for row in results} if results else {}

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed batch entity lookup: {e}")
            return {}

    def recalculate_counts(self, group_id: int, affected_member_ids: List[int]) -> int:
        """Recalculate member_count for the group and group_count for affected members."""
        updated = 0
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                # Update member_count on group_application_data
                cur.execute("""
                    UPDATE group_application_data
                    SET member_count = (
                        SELECT COUNT(*)
                        FROM group_memberships
                        WHERE group_id = %s AND status = '1'
                        AND membership_status IN ('1', '5')
                    )
                    WHERE entity_id = %s AND status = '1'
                """, (group_id, group_id))
                updated += cur.rowcount

                # Update group_count on each affected member entity
                for member_id in affected_member_ids:
                    cur.execute("""
                        UPDATE entities
                        SET group_count = (
                            SELECT COUNT(DISTINCT group_id)
                            FROM group_memberships
                            WHERE member_id = %s AND status = '1'
                            AND membership_status IN ('1', '5')
                        )
                        WHERE id = %s
                    """, (member_id, member_id))
                    updated += cur.rowcount

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to recalculate counts for group {group_id}: {e}")

        return updated

    def update_last_monitoring_time(self, group_id: int, timestamp: str) -> bool:
        """Update last_monitoring_time on the group entity if the new timestamp is more recent."""
        try:
            with self.pool.connection() as conn, conn.cursor() as cur:
                cur.execute("""
                    UPDATE entities
                    SET last_monitoring_time = %s
                    WHERE id = %s
                    AND (last_monitoring_time IS NULL OR last_monitoring_time < %s)
                """, (timestamp, group_id, timestamp))
                return cur.rowcount > 0

        except Exception as e:
            print(f"[MembershipVerifyDB] Failed to update last_monitoring_time for group {group_id}: {e}")
            return False
