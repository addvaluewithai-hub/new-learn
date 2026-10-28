import { useRef } from 'react';
import { FILE_TYPES } from './choices';

const megabytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} ميجا`;

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
  const picker = useRef<HTMLInputElement>(null);
  return (
    <div className="composer">
      <label className="sr-only" htmlFor="studio-topic">
        الكورس عن إيه؟
      </label>
      <textarea
        id="studio-topic"
        value={topic}
        onChange={(e) => onTopic(e.target.value)}
        maxLength={4000}
        rows={4}
        placeholder="اكتب الموضوع ولمين، وأي حاجة مهمة: «الفايدة المركبة لطلاب أولى تجارة، بأمثلة من البنوك المصرية»"
      />
      {files.length > 0 && (
        <ul className="composer-files" aria-label="ملفاتك">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`}>
              <span className="file-name">{file.name}</span>
              <small>{megabytes(file.size)}</small>
              <button type="button" aria-label={`شيل ${file.name}`} onClick={() => onRemove(i)}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="composer-bar">
        <button type="button" className="composer-attach" onClick={() => picker.current?.click()}>
          <span aria-hidden="true">📎</span> ارفع ملفات
        </button>
        <input
          ref={picker}
          className="sr-only"
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
          <span>يدوّر على النت</span>
        </label>
        <span className="composer-hint">PDF أو Word أو صور أو نص، لحد ٥ ملفات</span>
      </div>
    </div>
  );
}
