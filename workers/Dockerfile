# New Learn's media worker image (docs/worker-cloud-run.md): the Cloud Run job that records
# voices (later pictures) with Vertex AI. Node built-ins only, a non-root user, no keys. The
# course builder keeps its own home on the VPS (docs/builder-server.md).
FROM node:22-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && useradd --create-home --shell /bin/bash worker
USER worker
WORKDIR /home/worker
ENV HOME=/home/worker \
  BUILDER_MODE=once
COPY --chown=worker:worker builder ./app/builder
COPY --chown=worker:worker media ./app/media
CMD ["node", "app/media/index.mjs"]
