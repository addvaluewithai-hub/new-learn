export type Env = {
  DATABASE_URL?: string;
  GEMINI_API_KEY?: string;
  GEMINI_CHAT_MODEL?: string;
  GEMINI_LIVE_MODEL?: string;
  NEON_AUTH_BASE_URL: string;
  APP_ORIGIN: string;
  ALLOW_CONTENT_REVIEW?: string;
  /** Shared with the builder worker on our server (docs/builder-server.md). */
  BUILDER_TOKEN?: string;
  /** E-mails of the platform's staff, comma separated: they review paid courses and grant
   *  credits (docs/credits.md). Not a secret; set in the Cloudflare project's variables. */
  STAFF_EMAILS?: string;
  /** The R2 bucket of recorded narration and pictures (docs/voice-agent.md), bound as MEDIA. */
  MEDIA?: MediaStore;
};

/** The part of an R2 bucket binding the app uses; a Map-backed fake serves the tests. */
export type MediaStore = {
  put(
    key: string,
    value: Uint8Array | ArrayBuffer,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  get(
    key: string,
    options?: { range?: Headers | { offset: number; length?: number } },
  ): Promise<{
    body: ReadableStream | null;
    size: number;
    range?: { offset: number; length?: number } | { suffix: number };
  } | null>;
};
export type AuthUser = { id: string; name: string; email: string };
