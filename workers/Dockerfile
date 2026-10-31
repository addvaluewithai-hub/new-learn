# New Learn's worker (docs/worker-cloud-run.md): the course builder, run as a Cloud Run job on
# a schedule. Node, the file converters the builder uses, and Claude Code for a non-root user.
FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl git poppler-utils pandoc \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --create-home --shell /bin/bash worker
USER worker
WORKDIR /home/worker
# Claude Code's native installer puts `claude` in ~/.local/bin.
RUN curl -fsSL https://claude.ai/install.sh | bash
ENV PATH="/home/worker/.local/bin:${PATH}" \
  HOME=/home/worker \
  WORK_ROOT=/tmp/new-learn-jobs \
  BUILDER_MODE=once \
  DISABLE_AUTOUPDATER=1 \
  DISABLE_UPDATES=1
COPY --chown=worker:worker builder ./app/builder
CMD ["node", "app/builder/index.mjs"]
