# The media worker on Cloud Run

Status (2026-10-31): decided and prepared; deploy once the voice module (docs/voice-agent.md)
is merged. The **builder** (Claude Code, course builds and side-chat edits) stays on the VPS
(docs/builder-server.md): it is already paid for and picks jobs up in seconds. The **media
worker** (voices, later pictures) runs as a Cloud Run **job** in the owner's Google Cloud
project, where Vertex AI needs no key, started every minute by Cloud Scheduler.

## Why a job, and why it is free

The worker needs no open port: it pulls jobs from the platform's builder API with
`BUILDER_TOKEN`. A scheduled Cloud Run job checks the queue; with nothing to do it exits in a
second. Cloud Run jobs bill only while a task runs, and the free tier covers about fifty CPU
hours a month: recording a lesson costs a fraction of a cent of compute, so the worker stays
inside the free tier long after the trial credits end. One Cloud Scheduler job is free. Vertex
AI usage (speech, transcription, images) bills per request in the same project, against the
trial credits first (docs/operations.md keeps the budget alert).

Recording is not interactive, so starting within a minute is fine: a run exits as soon as the
queue is empty (`LINGER_MS=0`) and the next minute's start picks up anything new. (The
builder's own `once` mode lingers three minutes after a job instead, so a teacher's follow-up
edits would start in seconds if it ever ran this way too; it needs its own image with Claude
Code in it.)

## Deploy (owner, Cloud Shell, once the voice module is merged)

1. **The secret** `BUILDER_TOKEN` in Secret Manager (Security → Secret Manager → Create
   secret), the same value the Cloudflare project holds. Paste it in the console; never in
   chat or a commit.
2. **Clone and deploy**:
   ```bash
   git clone --depth 1 https://github.com/addvaluewithai-hub/new-learn && cd new-learn
   bash workers/cloudrun/deploy.sh
   ```
   The script enables the APIs, creates the `learn-worker` service account (Vertex AI user,
   secret accessor), builds the image from `workers/Dockerfile` in the cloud, deploys the job
   `learn-media` with the secret as an environment variable, and schedules it every minute.
   Set `REGION` before running it to pick a region (default `europe-west1`).
3. **A test:** record one lesson from the teacher's page, then watch
   `gcloud run jobs executions list --job=learn-media --region=europe-west1` and Cloud Logging.

## Environment

| Variable                        | Meaning                                                                   |
| ------------------------------- | ------------------------------------------------------------------------- |
| `NEW_LEARN_ORIGIN`              | The platform's origin (`https://new-learn.pages.dev`)                     |
| `BUILDER_TOKEN` (secret)        | The builder API's token (Cloudflare secret of the same name)              |
| `GCP_PROJECT_ID`                | The Google Cloud project Vertex AI and Speech requests go to              |
| `TTS_REGION`, `TTS_MODELS`      | Gemini TTS location (`global`) and the models to try, in order            |
| `SPEECH_REGION`, `SPEECH_MODEL` | Speech-to-Text v2 location (`eu`) and model (`chirp_3`) for word timings  |
| `BUILDER_MODE`                  | `once` (a scheduled job, the image's default) or `forever` (a server)     |
| `MAX_RUN_MS`, `LINGER_MS`       | In `once` mode: take no new job after 50 min; keep polling after the last |

Google credentials are never configured: inside Cloud Run the job uses its service account
through the metadata server (Application Default Credentials). Outside Google Cloud (a test
on a laptop) `GOOGLE_APPLICATION_CREDENTIALS` (a service-account file) or `GOOGLE_ACCESS_TOKEN`
work too.

## What the worker does

`workers/media/` (Node built-ins only): it claims `voice` jobs from the builder API, asks for
the job's lines (`GET /builder/jobs/:id/lines`: the course's voice, language and the approved
lines with their tones and hashes), and for each line calls Gemini TTS on Vertex AI with a
delivery instruction (the character, the pace, the line's tone; `<short pause>` for line breaks,
English inside Arabic tagged for the voice), listens back with Speech-to-Text (word timings),
lays the script's words on the timings, and scores the take against the script. A take below
the bar is made once more with a firmer instruction; the better one is kept, flagged for the
teacher when still below. Each clip goes back as `POST /builder/jobs/:id/clips` (WAV, seconds,
word times, what was heard, the score, the flag); the platform keeps it in R2 under the line's
hash, so unchanged lines are never recorded twice.

## Updating

Merge to `main`, then run `bash workers/cloudrun/deploy.sh` again from Cloud Shell (it rebuilds
the image and redeploys the job). A GitHub Action with Workload Identity Federation can do
this on every merge later (deploy only; production work never runs on Actions).
