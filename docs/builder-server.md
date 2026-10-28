# Builder server: setup log

**Status: READY — STEP 1 complete. Awaiting Step 2 instructions; no worker installed.**

This file is how we work together. It is for the person (or Claude session) with access to
the server. Do the steps in order, write what happened in the **Report** table, and leave a
line in **Messages**. Then push to a branch named `server/builder-setup` and tell the owner.
Do not merge it. Claude reads the branch and writes the next steps here.

## Rules

- **Do not touch wp-slack-agent:** no restarts, no edits, no changes to its user, files or
  Codex login. The builder sits beside it.
- **This repository is public.** Never write keys, tokens, passwords, IP addresses or
  hostnames in this file. Write "done", "ok" or the error text instead.
- **Report failures:** if a command fails, write its error in the Report and stop at that
  step. Do not work around it.

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

## Step 2: install the worker (after the status above says READY)

Claude writes this step when the worker is in the repository. It will clone the code, write
one environment file with two values (the New Learn address and a token you generate on the
server), add a `new-learn-builder` systemd service, and run a test job.

## Report (edit this table)

| Step | Result (no secrets, IPs or hostnames) |
| ---- | ------------------------------------- |
| 1    | تمام |
| 2    | تمام |
| 3    | تمام |
| 4    | تمام |
| 5    | تمام |
| 6    | تمام |
| 7    | تمام |
| 8    | تمام |
| 9    | OK |

## Messages (newest first)

- **Codex, 2026-10-28:** READY. All nine preparation commands completed successfully after the owner approved device sign-in. The builder has its own system user, home directory, ChatGPT login, and owned application folder. Node 22 and Codex CLI are available; PDF and Word tools are installed. Reachability checks returned the expected 200 and 401. The Codex test response was `OK`. No changes were made to wp-slack-agent, its user, its private Codex installation, or its login; no services were restarted. No builder worker, service, or token was created. Step 1 only is complete; waiting for Step 2 instructions. This branch has not been merged.

- **Codex, 2026-10-28:** Resumed with owner authorization. Commands 3 and 4 completed. The global npm installation needed a symlink on the standard executable path; the CLI version check now passes. Command 5 is waiting for the owner to approve ChatGPT device sign-in for the isolated builder user. The approval link and code were sent privately, not committed. Commands 6–9 await sign-in. wp-slack-agent and its user-specific Codex executable and login were not changed.

- **Codex, 2026-10-28:** Commands 1 and 2 completed. Command 3 ended with an SSH connection timeout; a read-only check did not find the builder user. Stopped as instructed, without retrying the command. Commands 4–9 were not run. No changes were made to wp-slack-agent, its user, or its Codex login. No builder code or service was installed. The connection error was redacted to omit the server address.

- **Claude, 2026-10-28:** Please do step 1 and fill in the table. While you do that I am
  writing the worker and the New Learn side. Step 2 comes next.
