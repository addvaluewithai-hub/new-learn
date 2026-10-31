// What things cost (docs/credits.md): the one place for credit prices, credit packs, course
// price limits and the teachers' share. The server charges from it and the pages show it, so
// changing a number here changes both. No React, no DOM: the server imports it too.

/** What one credit is worth when sold, in US cents (packs give a discount on top). */
export const CREDIT_CENTS = 10;

/** Credits every new account starts with, once. */
export const STARTER_CREDITS = 60;

export type ActionId =
  | 'course.build'
  | 'lesson.refine'
  | 'voice.minute'
  | 'voice.clone'
  | 'marketing.landing'
  | 'marketing.short'
  | 'marketing.posts'
  | 'tutor.minute';

export type Action = {
  id: ActionId;
  /** Credits per unit. */
  credits: number;
  /** What one unit is, for the price list: a course, a minute, a set. */
  unit: 'each' | 'minute' | 'set';
  /** `live` actions are charged today; `soon` ones are priced and shown, not built yet. */
  status: 'live' | 'soon';
  /** Our own cost per unit in US cents (rough, for margins); never shown to users. */
  costCents: number;
};

export const ACTIONS: Record<ActionId, Action> = {
  // One builder run: the agent writes the course, its lessons and boards (Claude, ~$1-3).
  'course.build': { id: 'course.build', credits: 30, unit: 'each', status: 'live', costCents: 250 },
  // One change asked in the side chat while editing a course.
  'lesson.refine': { id: 'lesson.refine', credits: 3, unit: 'each', status: 'live', costCents: 20 },
  // Recorded narration in a chosen voice, per minute of audio.
  'voice.minute': { id: 'voice.minute', credits: 2, unit: 'minute', status: 'live', costCents: 12 },
  // The teacher's own voice, cloned once with their written consent.
  'voice.clone': { id: 'voice.clone', credits: 20, unit: 'each', status: 'soon', costCents: 100 },
  'marketing.landing': {
    id: 'marketing.landing',
    credits: 15,
    unit: 'each',
    status: 'soon',
    costCents: 60,
  },
  // A short vertical video from a lesson, for reels and shorts.
  'marketing.short': {
    id: 'marketing.short',
    credits: 10,
    unit: 'each',
    status: 'soon',
    costCents: 40,
  },
  // A set of five social posts with their images.
  'marketing.posts': {
    id: 'marketing.posts',
    credits: 5,
    unit: 'set',
    status: 'soon',
    costCents: 20,
  },
  // Nova live by voice, per minute, beyond what a plan includes.
  'tutor.minute': { id: 'tutor.minute', credits: 1, unit: 'minute', status: 'soon', costCents: 4 },
};

export type Pack = { id: string; credits: number; priceCents: number };

/** Credit packs, in US cents. Bigger packs cost less per credit. Sold once payments connect. */
export const PACKS: Pack[] = [
  { id: 'small', credits: 100, priceCents: 1000 },
  { id: 'medium', credits: 300, priceCents: 2700 },
  { id: 'large', credits: 1000, priceCents: 8000 },
];

/** Currencies a course can be priced in, with the lowest and highest price in minor units. */
export const COURSE_PRICES = {
  USD: { min: 100, max: 50000 },
  EGP: { min: 2000, max: 1000000 },
} as const;
export type Currency = keyof typeof COURSE_PRICES;

/** The teacher's share of a paid course sale, before payment fees (to be settled). */
export const TEACHER_SHARE = 0.8;

/** A course price check: free (0) or within the currency's limits. */
export function validPrice(amount: unknown, currency: unknown): amount is number {
  if (amount === 0) return true;
  if (typeof amount !== 'number' || !Number.isInteger(amount)) return false;
  const limits = COURSE_PRICES[currency as Currency];
  return !!limits && amount >= limits.min && amount <= limits.max;
}
