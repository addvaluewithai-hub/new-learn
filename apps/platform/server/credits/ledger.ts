import { and, desc, eq, sql } from 'drizzle-orm';
import type { Db } from '../db/connection';
import { creditEntries, type CreditKind } from '../db/money';
import type { AuthUser } from '../env';
import { HttpError } from '../http';
import { ACTIONS, STARTER_CREDITS, type ActionId } from '../../src/features/credits/pricing';

// The credit ledger (docs/credits.md): insert-only rows, the balance is their sum. A charge
// and its refund are tied to the thing charged (`ref`), and the table allows one of each per
// ref, so a retried request can never charge or refund twice.

type Who = Pick<AuthUser, 'id' | 'email'>;

async function add(
  db: Db,
  who: Who,
  row: {
    amount: number;
    kind: CreditKind;
    action?: string;
    ref?: string;
    note?: string;
    by?: string;
  },
) {
  const inserted = await db
    .insert(creditEntries)
    .values({
      userId: who.id,
      userEmail: who.email,
      amount: row.amount,
      kind: row.kind,
      action: row.action ?? '',
      ref: row.ref ?? '',
      note: row.note ?? '',
      createdBy: row.by ?? '',
    })
    .onConflictDoNothing()
    .returning({ id: creditEntries.id });
  return inserted.length > 0;
}

/** Every account starts with some credits, once (written on first use, not at sign-up). */
export async function ensureStarter(db: Db, who: Who) {
  await add(db, who, { amount: STARTER_CREDITS, kind: 'starter', ref: 'starter' });
}

export async function balance(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ total: sql<string>`coalesce(sum(${creditEntries.amount}), 0)` })
    .from(creditEntries)
    .where(eq(creditEntries.userId, userId));
  return Number(row?.total ?? 0);
}

/** The account's balance after its starter credits, and its recent entries. */
export async function account(db: Db, who: Who) {
  await ensureStarter(db, who);
  const entries = await db
    .select()
    .from(creditEntries)
    .where(eq(creditEntries.userId, who.id))
    .orderBy(desc(creditEntries.createdAt))
    .limit(50);
  return {
    balance: await balance(db, who.id),
    entries: entries.map((e) => ({
      id: e.id,
      amount: e.amount,
      kind: e.kind,
      action: e.action,
      note: e.note,
      at: e.createdAt.toISOString(),
    })),
  };
}

/** Charge a priced action for `ref`; refuses (402) when the balance is short. */
export async function spend(db: Db, who: Who, action: ActionId, ref: string, units = 1) {
  const cost = ACTIONS[action].credits * units;
  // Already charged for this (a retried request): nothing more to pay.
  if (await charged(db, who.id, ref)) return cost;
  await ensureStarter(db, who);
  const have = await balance(db, who.id);
  if (have < cost) throw new HttpError(402, 'credits.notEnough', { cost, balance: have });
  await add(db, who, { amount: -cost, kind: 'spend', action, ref });
  return cost;
}

async function charged(db: Db, userId: string, ref: string) {
  const [charge] = await db
    .select()
    .from(creditEntries)
    .where(
      and(
        eq(creditEntries.userId, userId),
        eq(creditEntries.kind, 'spend'),
        eq(creditEntries.ref, ref),
      ),
    );
  return charge ?? null;
}

/** Give back what `ref` was charged, once (a build that failed). */
export async function refund(db: Db, userId: string, ref: string) {
  const charge = await charged(db, userId, ref);
  if (!charge) return false;
  return add(
    db,
    { id: userId, email: charge.userEmail },
    { amount: -charge.amount, kind: 'refund', action: charge.action, ref },
  );
}

/**
 * Staff give credits to an account by its e-mail. The account must have opened the app once
 * (that is when its starter row, which carries the e-mail, is written).
 */
export async function grant(
  db: Db,
  staff: AuthUser,
  input: { email: string; amount: number; note: string },
) {
  const email = input.email.trim().toLowerCase();
  if (!Number.isInteger(input.amount) || input.amount < 1 || input.amount > 100000)
    throw new HttpError(400, 'credits.badAmount');
  const [known] = await db
    .select({ userId: creditEntries.userId, userEmail: creditEntries.userEmail })
    .from(creditEntries)
    .where(sql`lower(${creditEntries.userEmail}) = ${email}`)
    .limit(1);
  if (!known) throw new HttpError(404, 'credits.unknownAccount');
  await add(
    db,
    { id: known.userId, email: known.userEmail },
    {
      amount: input.amount,
      kind: 'grant',
      ref: `grant:${crypto.randomUUID()}`,
      note: input.note.slice(0, 200),
      by: staff.id,
    },
  );
  return { email: known.userEmail, balance: await balance(db, known.userId) };
}
