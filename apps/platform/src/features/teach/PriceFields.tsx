import { Segmented, TextInput } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { COURSE_PRICES, TEACHER_SHARE, type Currency } from '../credits/pricing';
import { formatPrice } from '../credits/format';
import type { Published } from './types';
import './price.css';

export type PriceChoice = { paid: boolean; amount: string; currency: Currency };

/** The price as minor units for the publish request (0 is free). */
export const priceCents = (p: PriceChoice) =>
  p.paid ? Math.round(Number(p.amount.replace(',', '.')) * 100) || 0 : 0;

/** Starts from what students see now, so republishing keeps the price unless it is changed. */
export function initialPrice(published: Published | null): PriceChoice {
  const cents = published?.review?.priceCents ?? published?.priceCents ?? 0;
  const currency = (published?.review?.currency ?? published?.currency ?? 'USD') as Currency;
  return { paid: cents > 0, amount: cents ? String(cents / 100) : '', currency };
}

/** Free or paid; for paid, the amount, the currency, the teacher's share, and the review note. */
export function PriceFields({
  value,
  onChange,
}: {
  value: PriceChoice;
  onChange: (v: PriceChoice) => void;
}) {
  const { t, locale } = useI18n();
  const limits = COURSE_PRICES[value.currency];
  return (
    <div className="teach-price">
      <h3>{t('teach.price.title')}</h3>
      <Segmented
        label={t('teach.price.title')}
        value={value.paid ? 'paid' : 'free'}
        options={[
          ['free', t('teach.price.free')],
          ['paid', t('teach.price.paid')],
        ]}
        onChange={(v) => onChange({ ...value, paid: v === 'paid' })}
      />
      {value.paid && (
        <>
          <div className="teach-price-row">
            <TextInput
              aria-label={t('teach.price.amount')}
              inputMode="decimal"
              dir="ltr"
              value={value.amount}
              placeholder={String(limits.min / 100)}
              onChange={(e) => onChange({ ...value, amount: e.target.value })}
            />
            <select
              aria-label={t('teach.price.currency')}
              value={value.currency}
              onChange={(e) => onChange({ ...value, currency: e.target.value as Currency })}
            >
              {(Object.keys(COURSE_PRICES) as Currency[]).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <small dir="ltr">
              {formatPrice(limits.min, value.currency, locale)} –{' '}
              {formatPrice(limits.max, value.currency, locale)}
            </small>
          </div>
          <p className="teach-note">
            {t('teach.price.share', { share: Math.round(TEACHER_SHARE * 100) })}
          </p>
          <p className="teach-note">{t('teach.price.reviewNote')}</p>
        </>
      )}
    </div>
  );
}

/** Where the paid version stands with the platform's review, with the reviewer's notes. */
export function ReviewStatus({ published }: { published: Published }) {
  const { t, locale } = useI18n();
  const review = published.review;
  if (!review) return null;
  const notes =
    review.notes === 'superseded'
      ? t('teach.price.superseded')
      : review.notes === 'unlisted'
        ? ''
        : review.notes;
  return (
    <div className="teach-review" data-status={review.status}>
      <strong>{t(`teach.price.status.${review.status}`, { version: review.version })}</strong>
      {published.publicVersion !== null && published.priceCents > 0 && (
        <span>
          {t('teach.price.publicPrice', {
            version: published.publicVersion,
            price: formatPrice(published.priceCents, published.currency, locale),
          })}
        </span>
      )}
      {notes && review.status !== 'pending' && (
        <div>
          <small>{t('teach.price.notesTitle')}</small>
          <p>
            <bdi>{notes}</bdi>
          </p>
        </div>
      )}
    </div>
  );
}
