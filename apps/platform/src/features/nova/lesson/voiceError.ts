import { t } from '../../../i18n';

/** What the learner sees when talking to Nova fails to start. */
export const reason = (error: unknown) =>
  error instanceof Error && error.name === 'NotAllowedError'
    ? t('nova.talk.micBlocked')
    : error instanceof Error
      ? error.message
      : t('nova.talk.failed');
