export type Env = {
  DATABASE_URL?: string;
  NEON_AUTH_BASE_URL: string;
  APP_ORIGIN: string;
  ALLOW_CONTENT_REVIEW?: string;
};
export type AuthUser = { id: string; name: string; email: string };
