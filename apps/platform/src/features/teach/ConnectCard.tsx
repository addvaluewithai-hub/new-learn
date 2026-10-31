import { useState } from 'react';
import { Button, ButtonLink, Card, TextInput } from '../../shared/ui';
import { useI18n } from '../../i18n';
import { CONNECTOR_URL, SITE_LINKS } from '../site/routes';

/** «Connect your AI»: the address a teacher adds to Claude or ChatGPT, with a copy button. */
export function ConnectCard() {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CONNECTOR_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Card className="teach-connect">
      <div>
        <h2>{t('teach.connect.title')}</h2>
        <p className="teach-note">{t('teach.connect.lead')}</p>
      </div>
      <div className="teach-share-row">
        <TextInput
          value={CONNECTOR_URL}
          readOnly
          dir="ltr"
          aria-label={t('teach.connect.address')}
          onFocus={(e) => e.currentTarget.select()}
        />
        <Button variant="secondary" onClick={copy}>
          {copied ? t('teach.publish.copied') : t('teach.publish.copy')}
        </Button>
      </div>
      <ButtonLink variant="link" href={SITE_LINKS.connect}>
        {t('teach.connect.how')} {t('common.forward')}
      </ButtonLink>
    </Card>
  );
}
