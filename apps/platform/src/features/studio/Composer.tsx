import { useRef } from 'react';
import { useI18n } from '../../i18n';
import { FILE_TYPES } from './choices';

/** «١ الفكرة»: one big box for the idea, the files beside it, and web search. */
export function Composer({
  topic,
  onTopic,
  files,
  onFiles,
  onRemove,
  webSearch,
  onWebSearch,
}: {
  topic: string;
  onTopic: (topic: string) => void;
  files: File[];
  onFiles: (list: FileList | null) => void;
  onRemove: (index: number) => void;
  webSearch: boolean;
  onWebSearch: (on: boolean) => void;
}) {
  const { t, locale } = useI18n();
  const picker = useRef<HTMLInputElement>(null);
  const size = new Intl.NumberFormat(locale, {
    numberingSystem: 'latn',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const megabytes = (bytes: number) =>
    t('studio.composer.size', { size: size.format(bytes / 1024 / 1024) });
  return (
    <div className="composer">
      <label className="nl-sr-only" htmlFor="studio-topic">
        {t('studio.composer.label')}
      </label>
      <textarea
        id="studio-topic"
        value={topic}
        onChange={(e) => onTopic(e.target.value)}
        maxLength={4000}
        rows={4}
        placeholder={t('studio.composer.placeholder')}
      />
      {files.length > 0 && (
        <ul className="composer-files" aria-label={t('studio.composer.files')}>
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`}>
              <bdi className="file-name">{file.name}</bdi>
              <small>{megabytes(file.size)}</small>
              <button
                type="button"
                aria-label={t('studio.composer.remove', { name: file.name })}
                onClick={() => onRemove(i)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="composer-bar">
        <button type="button" className="composer-attach" onClick={() => picker.current?.click()}>
          <span aria-hidden="true">📎</span> {t('studio.composer.attach')}
        </button>
        <input
          ref={picker}
          className="nl-sr-only"
          type="file"
          multiple
          accept={FILE_TYPES}
          tabIndex={-1}
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <label className="composer-switch">
          <input
            type="checkbox"
            role="switch"
            checked={webSearch}
            onChange={(e) => onWebSearch(e.target.checked)}
          />
          <span>{t('studio.composer.webSearch')}</span>
        </label>
        <span className="composer-hint">{t('studio.composer.hint')}</span>
      </div>
    </div>
  );
}
