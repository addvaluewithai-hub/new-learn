import type { AuthUser, Env } from './env';
import { HttpError } from './http';

// The platform's own team (docs/credits.md): whoever's e-mail is in STAFF_EMAILS reviews paid
// courses and grants credits. Nobody is staff until the owner sets the variable.

export function isStaff(env: Env, user: AuthUser | null): boolean {
  if (!user?.email) return false;
  const emails = (env.STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return emails.includes(user.email.toLowerCase());
}

export function requireStaff(env: Env, user: AuthUser) {
  if (!isStaff(env, user)) throw new HttpError(403, 'staff.only');
}
