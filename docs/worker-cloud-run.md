# The worker on Cloud Run

Status (2026-10-31): the builder runs as a Cloud Run **job** in the owner's Google Cloud project
(the one with the trial credits), started every minute by Cloud Scheduler. It replaces the VPS
(docs/builder-server.md), which stays on until the first Cloud Run build succeeds end to end.
The voice and image modules will run in the same image (docs/voice-agent.md).

## Why a job, not a server

The worker needs no open port: it pulls jobs from the platform's builder API with
`BUILDER_TOKEN`. A Cloud Run job started on a schedule checks the queue; with nothing to do it
exits in a second, so an idle platform costs nothing. With a job it works for as long as the
build takes (up to the task timeout, 1 hour). Inside the project it reaches Vertex AI with its
service account and no key, which is what the organisation's policy requires.

A build starts within a minute or two of the request. If instant pickup is ever worth about
$15 a month, the same image runs as an always-on service with `BUILDER_MODE=forever`.

## Deploy (owner, Cloud Shell, once)

1. **Two secrets**, in Secret Manager, with values pasted in the console (Security → Secret
   Manager → Create secret) or from Cloud Shell without echoing them:
   - `BUILDER_TOKEN`: the same value the Cloudflare project holds.
   - `CLAUDE_CODE_OAUTH_TOKEN`: from `claude setup-token` on your own computer (the owner's
     Claude account, testing only, task Y13). At launch, replace it with `ANTHROPIC_API_KEY`
     and change the deploy script's `--set-secrets` line.
2. **Clone and deploy**:
   ```bash
   git clone --depth 1 https://github.com/addvaluewithai-hub/new-learn && cd new-learn
   bash workers/cloudrun/deploy.sh
   ```
   The script enables the APIs, creates the `learn-worker` service account (Vertex AI user,
   secret accessor), builds the image from `workers/Dockerfile`, deploys the job with the
   secrets mounted as environment variables, and schedules it every minute. Set `REGION`
   before running it to pick a region (default `europe-west1`).
3. **A test build:** open `/?studio`, build a small course, then watch
   `gcloud run jobs executions list --job=learn-worker --region=europe-west1` and the logs in
   Cloud Logging. The page should show «افتح أول درس».
4. **Stop the VPS service** once that works: `sudo systemctl disable --now new-learn-builder`
   on the server. Two workers claiming the same queue would only double the Claude usage.

## Environment

| Variable                            | Meaning                                                               |
| ----------------------------------- | --------------------------------------------------------------------- |
| `NEW_LEARN_ORIGIN`                  | The platform's origin (`https://new-learn.pages.dev`)                 |
| `BUILDER_TOKEN` (secret)            | The builder API's token (Cloudflare secret of the same name)          |
| `CLAUDE_CODE_OAUTH_TOKEN` (secret)  | The owner's Claude account, until an API key                          |
| `ANTHROPIC_API_KEY` (secret, later) | Replaces the account token at launch; `CLAUDE_BUDGET_USD` with it     |
| `BUILDER_ENGINE`, `CLAUDE_MODEL`    | `claude` (default) or `codex`; the model name                         |
| `BUILDER_MODE`                      | `once` (a scheduled job, the image's default) or `forever` (a server) |
| `MAX_RUN_MS`                        | In `once` mode, take no new job after this long (default 50 minutes)  |
| `WORK_ROOT`                         | Job folders (`/tmp/new-learn-jobs` in the image)                      |

Google credentials are never configured: inside Cloud Run the job uses its service account
through the metadata server (Application Default Credentials).

## Updating

Merge to `main`, then run `bash workers/cloudrun/deploy.sh` again from Cloud Shell (it rebuilds
the image and redeploys the job). A GitHub Action with Workload Identity Federation can do
this on every merge later (deploy only; production work never runs on Actions).

## Costs

Cloud Run jobs bill only while a task runs: a 10-minute build on 2 vCPU and 2 GiB is a few
cents. The scheduler's minute ticks that find nothing cost about nothing. Vertex AI usage
(voices, images) bills per request in the same project; keep the billing budget alert
(docs/operations.md).
