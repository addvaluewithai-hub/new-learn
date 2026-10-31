import type { TextKey } from '../../i18n';
import type { ActionId } from './pricing';

/** A price in minor units, written the language's way (US$15.00, 15,00 $US, 250 ج.م.). */
export function formatPrice(cents: number, currency: string, locale: string) {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      numberingSystem: 'latn',
      maximumFractionDigits: cents % 100 ? 2 : 0,
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

/** The price list's line for each action. */
export const ACTION_KEYS: Record<ActionId, TextKey> = {
  'course.build': 'credits.actions.courseBuild',
  'lesson.refine': 'credits.actions.lessonRefine',
  'voice.minute': 'credits.actions.voiceMinute',
  'voice.clone': 'credits.actions.voiceClone',
  'marketing.landing': 'credits.actions.marketingLanding',
  'marketing.short': 'credits.actions.marketingShort',
  'marketing.posts': 'credits.actions.marketingPosts',
  'tutor.minute': 'credits.actions.tutorMinute',
};

export type CreditsView = {
  balance: number;
  starter: number;
  entries: Array<{
    id: string;
    amount: number;
    kind: string;
    action: string;
    note: string;
    at: string;
  }>;
  prices: Array<{
    id: ActionId;
    credits: number;
    unit: 'each' | 'minute' | 'set';
    status: 'live' | 'soon';
  }>;
  packs: Array<{ id: string; credits: number; priceCents: number }>;
  payments: { connected: boolean };
};
