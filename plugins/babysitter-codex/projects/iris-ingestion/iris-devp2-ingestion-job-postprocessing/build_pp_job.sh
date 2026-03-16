#!/bin/bash
# Build the unified PP job image
# Usage: ./build_pp_job.sh [--dry-run]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INGESTION_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ID="veritas-452309"
REGION="me-west1"
REPO="iris-devp2-ingestion-repo-main-orchestrator"
IMAGE_NAME="iris-devp2-ingestion-pp-job"
TAG="latest"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

echo "Building PP Job image..."
echo "  Ingestion dir: $INGESTION_DIR"
echo "  Image: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${TAG}"

# Create temp build context
BUILD_DIR=$(mktemp -d)
trap "rm -rf $BUILD_DIR" EXIT

echo "Preparing build context in $BUILD_DIR..."

# Copy PP service directories (strip the iris-devp2-ingestion- prefix for cleaner paths)
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-translation" "$BUILD_DIR/pp-group-translation"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-member-blacklist" "$BUILD_DIR/pp-group-member-blacklist"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-ai-summary" "$BUILD_DIR/pp-group-ai-summary"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-data-inheritance" "$BUILD_DIR/pp-group-data-inheritance"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-callerapi-enrichment" "$BUILD_DIR/pp-group-callerapi-enrichment"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-activity-timestamp" "$BUILD_DIR/pp-group-activity-timestamp"
cp -r "$INGESTION_DIR/iris-devp2-ingestion-pp-group-membership-verify" "$BUILD_DIR/pp-group-membership-verify"

# Copy entry point and Dockerfile
cp "$SCRIPT_DIR/pp_job_main.py" "$BUILD_DIR/"
cp "$SCRIPT_DIR/Dockerfile.pp-job" "$BUILD_DIR/Dockerfile"

# Merge all requirements.txt files, deduplicate
# Some files may be UTF-16 encoded, so convert all to UTF-8 first
echo "Merging requirements..."
for req in "$BUILD_DIR"/pp-group-*/requirements.txt; do
  if file "$req" | grep -q "UTF-16"; then
    iconv -f UTF-16 -t UTF-8 "$req" > "${req}.tmp" && mv "${req}.tmp" "$req"
  fi
done
# Instead of merging pinned versions (which causes conflicts between services),
# extract just package names and let pip resolve compatible versions
cat "$BUILD_DIR"/pp-group-*/requirements.txt 2>/dev/null | \
  tr -d '\r' | grep -v '^#' | grep -v '^$' | \
  sed 's/==.*//; s/>=.*//; s/<=.*//; s/@.*//' | \
  sort -u | grep -v '^$' | grep -v '^en_core_web_sm' | grep -v '^modules$' > "$BUILD_DIR/requirements.txt"

# Add google-cloud-storage (needed for manifest reading)
echo "google-cloud-storage" >> "$BUILD_DIR/requirements.txt"

# Add google-cloud-storage if not present (needed for manifest reading)
if ! grep -q "google-cloud-storage" "$BUILD_DIR/requirements.txt"; then
  echo "google-cloud-storage>=2.0.0" >> "$BUILD_DIR/requirements.txt"
fi

echo "Merged requirements:"
cat "$BUILD_DIR/requirements.txt"
echo ""

if $DRY_RUN; then
  echo "[DRY RUN] Would build and push image"
  echo "Build context contents:"
  ls -la "$BUILD_DIR"
  exit 0
fi

# Build using Cloud Build
FULL_IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${IMAGE_NAME}:${TAG}"
echo "Submitting to Cloud Build..."
gcloud builds submit "$BUILD_DIR" \
  --project="$PROJECT_ID" \
  --tag="$FULL_IMAGE" \
  --timeout=1200s \
  --quiet

echo ""
echo "Image built and pushed: $FULL_IMAGE"
echo "Done!"
