#!/bin/bash
set -euo pipefail

PROJECT="veritas-452309"
REGION="me-west1"
JOB_NAME="iris-pipeline-monitor"
IMAGE="gcr.io/${PROJECT}/${JOB_NAME}"
SA_EMAIL="${JOB_NAME}@${PROJECT}.iam.gserviceaccount.com"

echo "=== Building Docker image ==="
docker build -t ${IMAGE} .

echo "=== Pushing to GCR ==="
docker push ${IMAGE}

echo "=== Creating/updating Cloud Run Job ==="
gcloud run jobs describe ${JOB_NAME} --region=${REGION} --project=${PROJECT} > /dev/null 2>&1 && \
  gcloud run jobs update ${JOB_NAME} \
    --image=${IMAGE} \
    --region=${REGION} \
    --project=${PROJECT} \
    --memory=512Mi \
    --cpu=1 \
    --task-timeout=600s \
    --max-retries=1 \
    --set-env-vars="GCP_PROJECT=${PROJECT},SSH_KEY_PATH=/secrets/ssh-key/latest" \
    --set-secrets="/secrets/ssh-key/latest=iris-pipeline-monitor-ssh-key:latest" \
    --service-account=${SA_EMAIL} \
  || \
  gcloud run jobs create ${JOB_NAME} \
    --image=${IMAGE} \
    --region=${REGION} \
    --project=${PROJECT} \
    --memory=512Mi \
    --cpu=1 \
    --task-timeout=600s \
    --max-retries=1 \
    --set-env-vars="GCP_PROJECT=${PROJECT},SSH_KEY_PATH=/secrets/ssh-key/latest" \
    --set-secrets="/secrets/ssh-key/latest=iris-pipeline-monitor-ssh-key:latest" \
    --service-account=${SA_EMAIL}

echo "=== Creating/updating Cloud Scheduler ==="
SCHEDULER_NAME="iris-pipeline-monitor-schedule"
SCHEDULER_LOCATION="me-central2"  # Scheduler location differs from Cloud Run region
gcloud scheduler jobs describe ${SCHEDULER_NAME} --location=${SCHEDULER_LOCATION} --project=${PROJECT} > /dev/null 2>&1 && \
  gcloud scheduler jobs update http ${SCHEDULER_NAME} \
    --location=${SCHEDULER_LOCATION} \
    --project=${PROJECT} \
    --schedule="*/10 * * * *" \
    --time-zone="UTC" \
    --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT}/jobs/${JOB_NAME}:run" \
    --http-method=POST \
    --oauth-service-account-email=${SA_EMAIL} \
  || \
  gcloud scheduler jobs create http ${SCHEDULER_NAME} \
    --location=${SCHEDULER_LOCATION} \
    --project=${PROJECT} \
    --schedule="*/10 * * * *" \
    --time-zone="UTC" \
    --uri="https://${REGION}-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/${PROJECT}/jobs/${JOB_NAME}:run" \
    --http-method=POST \
    --oauth-service-account-email=${SA_EMAIL}

echo "=== Deployment complete ==="
echo "Monitor will run every 10 minutes."
echo "To run manually: gcloud run jobs execute ${JOB_NAME} --region=${REGION} --project=${PROJECT}"
