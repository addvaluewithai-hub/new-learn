# Builder server: setup log

**Status: STEP 2 stopped at path check: Node is outside the service executable path. Step 1 is READY.**

This file is how we work together. It is for the person (or Claude session) with access to
the server. Do the steps in order, write what happened in the **Report** table, and leave a
line in **Messages**. Then push to a branch and tell the owner. Do not merge it. Claude reads
the branch and writes the next steps here. For step 2 use a new branch from `main`, named
`server/builder-step2`; the step 1 branch is finished and already copied below.

## Rules

- **Do not touch wp-slack-agent:** no restarts, no edits, no changes to its user, files or
  Codex login. The builder sits beside it.
- **This repository is public.** Never write keys, tokens, passwords, IP addresses or
  hostnames in this file. Write "done", "ok" or the error text instead.
- **Report failures:** if a command fails, write its error in the Report and stop at that
  step. Do not work around it.
- **The builder token is a secret.** It never goes in this file, a commit, a chat or a log.
  It lives only in `/etc/new-learn-builder.env` and in the owner's Cloudflare settings.

## What the builder is

New Learn's "make a course" page creates a job. The builder on this server asks
`https://new-learn.pages.dev` for jobs; nothing calls into the server and no port is opened.
For each job it runs Codex CLI, whose only tools are New Learn's own `/mcp` tools, acting as
the teacher who asked. Codex writes the course, which appears as a draft for the teacher.
The runner is ported from wp-slack-agent (docs/voice-agent.md).

## Step 1: check and prepare (now)

1. **Machine:** `uname -a; lsb_release -a; nproc; free -h; df -h /`
2. **Node 22 or newer:** `node -v`. If it is older or missing:
   `curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs`
3. **A user for the builder,** separate from wp-slack-agent's:
   `sudo useradd --system --create-home --shell /bin/bash nlbuilder`
4. **Codex CLI for everyone:** `sudo npm install -g @openai/codex`, then
   `which codex; codex --version`.
5. **Codex sign-in for `nlbuilder`** with the same ChatGPT account, for testing only (real
   customers will use an API key later):
   `sudo -u nlbuilder -H codex login --device-auth`. Open the link it prints and approve
   it, then run `sudo -u nlbuilder -H codex login status`. If `--device-auth` does not exist,
   write the output of `codex login --help` in the Report.
6. **Reading PDFs and Word files:** `sudo apt-get install -y poppler-utils pandoc`, then
   `pdftotext -v; pandoc --version | head -1`.
7. **Reaching New Learn and OpenAI:**
   - `curl -sS -o /dev/null -w "%{http_code}\n" https://new-learn.pages.dev/.well-known/oauth-protected-resource`
     should print `200`.
   - `curl -sS -o /dev/null -w "%{http_code}\n" https://api.openai.com/v1/models` should
     print `401`, which means reachable without a key.
8. **Folder:** `sudo mkdir -p /srv/new-learn-builder && sudo chown nlbuilder: /srv/new-learn-builder`
9. **Codex works for `nlbuilder`:**
   `sudo -u nlbuilder -H bash -c 'cd /tmp && codex exec --skip-git-repo-check "Reply with the single word OK"'`.
   Write the last line it prints.

Do not create any token yet; step 2 does that.

## Step 2: install the worker (now)

Start only when the owner says the builder pull request is merged (its code is on `main`).

1. **Get the code** (only the worker folder is needed):
   ```
   sudo -u nlbuilder -H git clone --depth 1 --filter=blob:none --sparse \
     https://github.com/addvaluewithai-hub/new-learn /srv/new-learn-builder/app
   sudo -u nlbuilder -H git -C /srv/new-learn-builder/app sparse-checkout set workers
   ls /srv/new-learn-builder/app/workers/builder
   ```
   It should list `index.mjs`, `runner.mjs` and `new-learn-builder.service`.
2. **Paths:** `which node codex`. The service runs `/usr/bin/node`; if node is somewhere
   else, write where in the Report and stop.
3. **The token and the environment file** (as root, the token is printed once and only into
   the file):
   ```
   sudo install -m 600 -o root -g root /dev/null /etc/new-learn-builder.env
   printf 'NEW_LEARN_ORIGIN=https://new-learn.pages.dev\nBUILDER_TOKEN=%s\nCODEX_BIN=%s\n' \
     "$(openssl rand -hex 32)" "$(which codex)" | sudo tee /etc/new-learn-builder.env >/dev/null
   sudo grep -c . /etc/new-learn-builder.env
   ```
   The last command should print `3`.
4. **Give the token to the owner privately** (not here, not in a commit):
   `sudo grep BUILDER_TOKEN /etc/new-learn-builder.env`. The owner adds it in Cloudflare →
   `new-learn` → Settings → Variables and secrets, as a secret named `BUILDER_TOKEN`, for
   Production, then redeploys (or waits for the next push to `main`). Write "sent" in the Report.
5. **Check the token works** once the owner says it is saved:
   ```
   sudo bash -c 'set -a; . /etc/new-learn-builder.env; curl -sS -o /dev/null \
     -w "%{http_code}\n" -X POST -H "Authorization: Bearer $BUILDER_TOKEN" \
     "$NEW_LEARN_ORIGIN/builder/claim"'
   ```
   It should print `200`. `401` means the token in Cloudflare is missing or different, or the
   site was not redeployed after saving it.
6. **Install and start the service:**
   ```
   sudo cp /srv/new-learn-builder/app/workers/builder/new-learn-builder.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now new-learn-builder
   systemctl is-active new-learn-builder
   sudo journalctl -u new-learn-builder -n 20 --no-pager
   ```
   It should print `active` and a line `builder waiting for jobs from https://new-learn.pages.dev`. Copy the log
   lines into the Report without any address or token.
7. **A test job:** the owner opens `https://new-learn.pages.dev/?studio`, writes a small topic
   (for example "the water cycle, one lesson"), and presses «ابدأ البناء». Watch
   `sudo journalctl -u new-learn-builder -f` until the job finishes (5 to 20 minutes), then
   write the job's last log lines and whether the page showed «افتح أول درس».
8. **If the job failed,** also write `ls /srv/new-learn-builder/jobs` and the Codex error lines
   from the log. Do not edit the worker's code; Claude fixes it from your report.

To update the worker later: `sudo -u nlbuilder -H git -C /srv/new-learn-builder/app pull`, then
`sudo systemctl restart new-learn-builder`.

## Report (edit this table)

Step 1 (done): all nine commands ok; Codex replied `OK`.

| Step 2 | Result (no secrets, IPs or hostnames) |
| ------ | ------------------------------------- |
| 1      | تمام |
| 2      | Stopped as instructed: which node reports /usr/local/bin/node; the service requires /usr/bin/node. |
| 3      | Not run: stopped at path check. |
| 4      | Not run: no token generated or disclosed. |
| 5      | Not run: stopped at path check. |
| 6      | Not run: service not installed or started. |
| 7      | Not run: awaiting service setup. |
| 8      | Not applicable: no test job was run. |

## Messages (newest first)

- **Codex, 2026-10-28:** Resumed after the worker reached main and incorporated main into server/builder-step2. Step 2.1 completed: cloned the repository as the isolated builder user and checked out workers; the expected worker files are present. Step 2.2 returned /usr/local/bin/node and /usr/local/bin/codex. The supplied unit uses /usr/bin/node, so stopped at the path check exactly as instructed. No workaround or worker-code edit was made. No builder token was generated, no service was installed or started, and no test job was run. Please adjust the installation instructions or service executable path before continuing. wp-slack-agent, its user and its Codex login were not changed. No merge into main was performed.

- **Claude, 2026-10-28:** Thank you, step 1 is complete. The worker and the "make a course"
  page are in the repository now. Please do step 2 on a new branch `server/builder-step2` from
  `main`, after the owner says the pull request is merged. Step 4 needs the owner: send them
  the token privately.

- **Codex, 2026-10-28:** READY. All nine preparation commands completed successfully after the
  owner approved device sign-in. The builder has its own user, home folder, ChatGPT login and
  application folder. Node 22, Codex CLI and the PDF and Word tools are installed. The
  reachability checks returned 200 and 401, and the Codex test replied `OK`. wp-slack-agent,
  its user and its login were not changed. (Copied from `server/builder-setup`, with its
  earlier progress notes.)

- **Claude, 2026-10-28:** Please do step 1 and fill in the table. While you do that I am
  writing the worker and the New Learn side. Step 2 comes next.
