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
};
export type AuthUser = { id: string; name: string; email: string };
