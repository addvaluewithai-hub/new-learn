#!/usr/bin/env bash
# Deploys New Learn's worker as a Cloud Run job, started every minute by Cloud Scheduler
# (docs/worker-cloud-run.md). Run from Cloud Shell in the project that holds the credits:
#   bash workers/cloudrun/deploy.sh
# It never prints a secret; the two secrets are created separately (see the doc).
set -euo pipefail
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${REGION:-europe-west1}"
JOB="${JOB:-learn-worker}"
SA_NAME="${SA_NAME:-learn-worker}"
SA="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
ORIGIN="${NEW_LEARN_ORIGIN:-https://new-learn.pages.dev}"
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
cd "$(dirname "$0")/.."

echo "== APIs"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com \
  secretmanager.googleapis.com cloudscheduler.googleapis.com aiplatform.googleapis.com \
  speech.googleapis.com --project="$PROJECT_ID"

echo "== Service account $SA"
gcloud iam service-accounts describe "$SA" --project="$PROJECT_ID" >/dev/null 2>&1 \
  || gcloud iam service-accounts create "$SA_NAME" --project="$PROJECT_ID" --display-name="New Learn worker"
for role in roles/aiplatform.user roles/secretmanager.secretAccessor; do
  gcloud projects add-iam-policy-binding "$PROJECT_ID" --member="serviceAccount:$SA" --role="$role" --quiet >/dev/null
done

echo "== Secrets must exist: BUILDER_TOKEN, CLAUDE_CODE_OAUTH_TOKEN (see the doc)"
for s in BUILDER_TOKEN CLAUDE_CODE_OAUTH_TOKEN; do
  gcloud secrets describe "$s" --project="$PROJECT_ID" >/dev/null
done

echo "== Job $JOB (built from this folder's Dockerfile)"
gcloud run jobs deploy "$JOB" --source . --project="$PROJECT_ID" --region="$REGION" \
  --service-account="$SA" --memory=2Gi --cpu=2 --task-timeout=3600 --max-retries=0 --tasks=1 \
  --set-env-vars="NEW_LEARN_ORIGIN=$ORIGIN,BUILDER_ENGINE=claude,CLAUDE_MODEL=${CLAUDE_MODEL:-sonnet},BUILDER_MODE=once" \
  --set-secrets="BUILDER_TOKEN=BUILDER_TOKEN:latest,CLAUDE_CODE_OAUTH_TOKEN=CLAUDE_CODE_OAUTH_TOKEN:latest"

echo "== Scheduler: start the job every minute"
gcloud run jobs add-iam-policy-binding "$JOB" --project="$PROJECT_ID" --region="$REGION" \
  --member="serviceAccount:$SA" --role=roles/run.invoker --quiet >/dev/null
URI="https://run.googleapis.com/v2/projects/$PROJECT_ID/locations/$REGION/jobs/$JOB:run"
if gcloud scheduler jobs describe "$JOB-tick" --project="$PROJECT_ID" --location="$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http "$JOB-tick" --project="$PROJECT_ID" --location="$REGION" \
    --schedule="* * * * *" --uri="$URI" --http-method=POST --oauth-service-account-email="$SA"
else
  gcloud scheduler jobs create http "$JOB-tick" --project="$PROJECT_ID" --location="$REGION" \
    --schedule="* * * * *" --uri="$URI" --http-method=POST --oauth-service-account-email="$SA"
fi
echo "== Done. Run one now: gcloud run jobs execute $JOB --region=$REGION --project=$PROJECT_ID"
echo "   Logs: gcloud run jobs executions list --job=$JOB --region=$REGION --project=$PROJECT_ID"
