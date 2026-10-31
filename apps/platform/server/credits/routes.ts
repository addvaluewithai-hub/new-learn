import { database } from '../db/connection';
import type { AuthUser, Env } from '../env';
import { body, HttpError, json } from '../http';
import { requireStaff } from '../staff';
import { paymentProvider, requireProvider } from '../payments/provider';
import { ACTIONS, PACKS, STARTER_CREDITS } from '../../src/features/credits/pricing';
import { account, grant } from './ledger';

// The credits page's API (docs/credits.md): the balance, its history, the price list and the
// packs; buying goes through a payment gateway once one is connected; staff grant credits.

export async function creditsRoute(request: Request, env: Env, user: AuthUser, path: string) {
  const db = database(env);
  if (path === '/api/credits' && request.method === 'GET')
    return json({
      ...(await account(db, user)),
      starter: STARTER_CREDITS,
      prices: Object.values(ACTIONS).map(({ costCents: _cost, ...price }) => price),
      packs: PACKS,
      payments: { connected: paymentProvider(env) !== null },
    });
  if (path === '/api/credits/checkout' && request.method === 'POST') {
    const input = await body(request);
    const pack = PACKS.find((p) => p.id === input.pack);
    if (!pack) throw new HttpError(400, 'credits.unknownPack');
    const provider = requireProvider(env);
    return json(await provider.checkout(env, user, { kind: 'pack', pack }));
  }
  if (path === '/api/credits/grant' && request.method === 'POST') {
    requireStaff(env, user);
    const input = await body(request);
    return json(
      await grant(db, user, {
        email: String(input.email ?? ''),
        amount: Number(input.amount),
        note: String(input.note ?? ''),
      }),
    );
  }
  throw new HttpError(404, 'http.notFound');
}
