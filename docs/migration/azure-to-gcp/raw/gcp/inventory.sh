#!/usr/bin/env bash
# Read-only inventory of GCP project boot-464019 for the Azure -> GCP migration.
# Run AFTER the owner has re-authenticated (see ../../03-gcp-readiness.md section 2).
# Writes one JSON/TSV file per command into this directory. Never prints secret values
# (Secret Manager is listed by NAME only; no `versions access`).
#
# Usage (Git Bash on Windows or any POSIX shell):
#   cd docs/migration/azure-to-gcp/raw/gcp && bash inventory.sh
#
# Every command is allowed to fail; the exact error lands in <name>.err so blockers are explicit.
set -u
PROJECT="${GCP_PROJECT_ID:-boot-464019}"
OUT="$(cd "$(dirname "$0")" && pwd)"
LOG="$OUT/_inventory.log"
: > "$LOG"

run() { # run <name> <cmd...>
  local name="$1"; shift
  echo "== $name: $*" | tee -a "$LOG"
  if "$@" > "$OUT/$name.json" 2> "$OUT/$name.err"; then
    rm -f "$OUT/$name.err"
  else
    echo "   FAILED (see $name.err)" | tee -a "$LOG"
  fi
}

# 0. Who am I / can I see the project
run auth-list            gcloud auth list --format=json
run config-list          gcloud config list --format=json
run project-describe     gcloud projects describe "$PROJECT" --format=json
run project-iam-policy   gcloud projects get-iam-policy "$PROJECT" --format=json
run billing-info         gcloud billing projects describe "$PROJECT" --format=json
run services-enabled     gcloud services list --enabled --project "$PROJECT" --format=json

# 1. Compute / network
run compute-networks     gcloud compute networks list --project "$PROJECT" --format=json
run compute-subnets      gcloud compute networks subnets list --project "$PROJECT" --format=json
run compute-addresses    gcloud compute addresses list --project "$PROJECT" --format=json
run compute-firewall     gcloud compute firewall-rules list --project "$PROJECT" --format=json
run compute-instances    gcloud compute instances list --project "$PROJECT" --format=json
run compute-disks        gcloud compute disks list --project "$PROJECT" --format=json
run compute-forwarding   gcloud compute forwarding-rules list --project "$PROJECT" --format=json
run compute-routers      gcloud compute routers list --project "$PROJECT" --format=json

# 2. Kubernetes / registry
run gke-clusters         gcloud container clusters list --project "$PROJECT" --format=json
run artifact-repos       gcloud artifacts repositories list --project "$PROJECT" --format=json
run gcr-legacy           gcloud container images list --project "$PROJECT" --format=json

# 3. Data
run sql-instances        gcloud sql instances list --project "$PROJECT" --format=json
run filestore            gcloud filestore instances list --project "$PROJECT" --format=json
run gcs-buckets          gcloud storage buckets list --project "$PROJECT" --format=json
run redis                gcloud redis instances list --region=- --project "$PROJECT" --format=json

# 4. DNS / TLS / secrets / identity
run dns-zones            gcloud dns managed-zones list --project "$PROJECT" --format=json
run secrets-names        gcloud secrets list --project "$PROJECT" --format='json(name,createTime,labels)'
run service-accounts     gcloud iam service-accounts list --project "$PROJECT" --format=json
run wif-pools            gcloud iam workload-identity-pools list --location=global --project "$PROJECT" --format=json
if [ -s "$OUT/wif-pools.json" ]; then
  for pool in $(jq -r '.[].name' "$OUT/wif-pools.json" | tr -d '\r'); do
    short="${pool##*/}"
    run "wif-providers-$short" gcloud iam workload-identity-pools providers list --workload-identity-pool="$short" --location=global --project "$PROJECT" --format=json
  done
fi

# 5. Serverless / AI / observability
run cloud-run            gcloud run services list --platform=managed --project "$PROJECT" --format=json
run cloud-functions      gcloud functions list --project "$PROJECT" --format=json
run vertex-endpoints     gcloud ai endpoints list --region=us-central1 --project "$PROJECT" --format=json
run vertex-models        gcloud ai models list --region=us-central1 --project "$PROJECT" --format=json
run logging-sinks        gcloud logging sinks list --project "$PROJECT" --format=json
run monitoring-channels  gcloud alpha monitoring channels list --project "$PROJECT" --format=json

# 6. Summary table (name/kind counts) for the readiness doc
{
  printf 'file\tcount\n'
  for f in "$OUT"/*.json; do
    n=$(jq 'if type=="array" then length else 1 end' "$f" 2>/dev/null || echo "?")
    printf '%s\t%s\n' "$(basename "$f" .json)" "$n"
  done
} | tr -d '\r' > "$OUT/_summary.tsv"
echo "done -> $OUT/_summary.tsv ; failures listed in $LOG" | tee -a "$LOG"
