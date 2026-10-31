import type { AuthUser, Env } from '../env';
import { HttpError } from '../http';
import type { Pack } from '../../src/features/credits/pricing';

// Where a payment gateway plugs in (docs/credits.md). Each gateway (Stripe, Paymob, Fawry…)
// implements this and is listed in `providers`; none is connected yet, so the pages show
// prices and the buy buttons say payments are coming.

export type Checkout = { url: string };

export interface PaymentProvider {
  id: string;
  /** Configured in this environment (keys present). */
  ready(env: Env): boolean;
  /** A hosted checkout for a credit pack or a course; the webhook grants what was bought. */
  checkout(
    env: Env,
    user: AuthUser,
    item:
      | { kind: 'pack'; pack: Pack }
      | { kind: 'course'; courseId: string; priceCents: number; currency: string },
  ): Promise<Checkout>;
}

/** The gateways the platform knows; add one here when its account exists. */
export const providers: PaymentProvider[] = [];

export function paymentProvider(env: Env): PaymentProvider | null {
  return providers.find((p) => p.ready(env)) ?? null;
}

export function requireProvider(env: Env): PaymentProvider {
  const provider = paymentProvider(env);
  if (!provider) throw new HttpError(503, 'payments.notConnected');
  return provider;
}
