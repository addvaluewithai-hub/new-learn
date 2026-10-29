# Builder server: setup log

**Status: STEP 3, switch the builder to Claude Code (owner's account for now). Step 2 is done and the builder works.**

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
For each job it runs Claude Code (or Codex CLI, `BUILDER_ENGINE=codex`), whose only tools
are New Learn's own `/mcp` tools plus reading the job's files, acting as the teacher who
asked. It writes the course, which appears as a draft for the teacher. The Codex runner is
ported from wp-slack-agent (docs/voice-agent.md); the Claude runner is `workers/builder/claude.mjs`.

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
2. **Paths:** `which node codex; node -v`. The service finds node in `/usr/local/bin` or
   `/usr/bin`; if it is elsewhere, or older than 22, write that in the Report and stop.
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

## Step 3: switch to Claude Code (now)

The worker now runs Claude Code by default (`BUILDER_ENGINE` unset or `claude`); Codex stays
available with `BUILDER_ENGINE=codex`. For now Claude Code signs in as the owner's Claude
account, like Codex did with ChatGPT (task Y13: testing only, never customers). When we
launch, an Anthropic API key goes into the environment file and the worker switches to it by
itself (`ANTHROPIC_API_KEY` set means bare mode with the key). Do this on a new branch
`server/builder-step3` from `main`.

1. **Update the worker:** `sudo -u nlbuilder -H git -C /srv/new-learn-builder/app pull`, then
   `ls /srv/new-learn-builder/app/workers/builder` should list `claude.mjs`.
2. **Install Claude Code for `nlbuilder`** (its own copy, in its home, no sudo):
   `sudo -u nlbuilder -H bash -c 'curl -fsSL https://claude.ai/install.sh | bash'`, then
   `sudo -u nlbuilder -H bash -c '~/.local/bin/claude --version'`. It must be 2.1.259 or
   newer (for `--permission-prompts`). Write the version in the Report.
3. **The account token.** The owner runs `claude setup-token` on their own computer (it needs
   a browser), copies the printed token (it lasts one year) and gives it to you privately.
   Append it to the environment file as root, never echoing it:
   `sudo bash -c 'printf "CLAUDE_CODE_OAUTH_TOKEN=%s\nBUILDER_ENGINE=claude\nCLAUDE_MODEL=sonnet\n" "<paste the token here>" >> /etc/new-learn-builder.env'`
   then `sudo grep -c . /etc/new-learn-builder.env` (should print `6`). Clear your shell
   history line afterwards (`history -d $(history 1 | awk '{print $1}')`). Make sure the file
   has no `ANTHROPIC_API_KEY` line yet: a key always wins over the account.
   (Without the owner's token, the alternative is a one-time sign-in on the server:
   `sudo -u nlbuilder -H bash -c 'cd /tmp && claude auth login'`, open the printed link in
   the owner's browser and paste the code back. The login is kept in `nlbuilder`'s home.)
4. **Claude Code works for `nlbuilder` with the account:**
   `sudo -u nlbuilder -H bash -c 'set -a; . /etc/new-learn-builder.env; claude auth status'`
   should print `"authMethod": "oauth_token"` (or `"claude.ai"` after a sign-in), then
   `sudo -u nlbuilder -H bash -c 'set -a; . /etc/new-learn-builder.env; cd /tmp && claude -p "Reply with the single word OK" --setting-sources user --output-format json --max-turns 1 --tools ""'`
   should print JSON whose `result` is `OK` and `is_error` is `false`. Write the last 2 lines.
5. **Reinstall the service file** (it now puts `~/.local/bin` on the PATH) and restart:
   ```
   sudo cp /srv/new-learn-builder/app/workers/builder/new-learn-builder.service /etc/systemd/system/
   sudo systemctl daemon-reload && sudo systemctl restart new-learn-builder
   sudo journalctl -u new-learn-builder -n 5 --no-pager
   ```
   The log should say `builder waiting for jobs from https://new-learn.pages.dev engine claude`.
6. **A test job:** the owner builds a small course from `?studio` with the chalk look. Watch
   `sudo journalctl -u new-learn-builder -f`; write the job's last lines and whether the page
   showed «افتح أول درس» and the board in the storyboard.
7. **If it failed,** write the error lines (no key, no token). `Not logged in` or
   `Failed to authenticate` means the token is missing or expired; `hit your session limit`
   or `weekly limit` means the account's usage limit (the page tells the teacher to try
   later); `error_max_turns` means `CLAUDE_MAX_TURNS` is too low for that course.

Later, at launch: the owner creates an API key at console.anthropic.com (named
`new-learn-builder`), you append `ANTHROPIC_API_KEY=...` and `CLAUDE_BUDGET_USD=8` to the
environment file, remove the `CLAUDE_CODE_OAUTH_TOKEN` line, and restart.

## Report (edit this table)

Step 1 (done): all nine commands ok; Codex replied `OK`.

| Step 2 | Result (no secrets, IPs or hostnames)                                                              |
| ------ | -------------------------------------------------------------------------------------------------- |
| 1      | تمام                                                                                               |
| 2      | Stopped as instructed: which node reports /usr/local/bin/node; the service requires /usr/bin/node. |
| 3      | Not run: stopped at path check.                                                                    |
| 4      | Not run: no token generated or disclosed.                                                          |
| 5      | Not run: stopped at path check.                                                                    |
| 6      | Not run: service not installed or started.                                                         |
| 7      | Not run: awaiting service setup.                                                                   |
| 8      | Not applicable: no test job was run.                                                               |

## Messages (newest first)

- **Claude, 2026-10-28:** Thanks for stopping there. The service now runs `node` from
  `/usr/local/bin` or `/usr/bin` (fixed on `main`). Please run
  `sudo -u nlbuilder -H git -C /srv/new-learn-builder/app pull`, merge `main` into
  `server/builder-step2`, and continue from step 2.2. Step 2.1 does not need repeating.

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
