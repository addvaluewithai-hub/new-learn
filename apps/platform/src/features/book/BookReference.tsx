import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LessonContext } from '@learn/lesson-runtime';
import { referencePart } from '../../../../../content/book-guided/physics-ch08/reference';
import './book-reference.css';
import { useI18n } from '../../i18n';

type Size = 'hidden' | 'small' | 'half' | 'full';
/** An optional scan reference beside the normal board, always following its lesson position. */
export function BookReference({
  context,
  resolve = referencePart,
  assetBase = '/book-ch08',
}: {
  context: LessonContext | null;
  resolve?: typeof referencePart;
  assetBase?: string;
}) {
  const { t, dir } = useI18n();
  const [size, setSize] = useState<Size>(() =>
    matchMedia('(max-width: 650px)').matches ? 'hidden' : 'small',
  );
  const dialog = useRef<HTMLDialogElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const wasFull = useRef(false);
  useEffect(() => {
    if (size === 'full') {
      const node = dialog.current;
      node?.showModal();
      wasFull.current = true;
      return () => {
        if (node?.open) node.close();
      };
    }
    if (wasFull.current) {
      panel.current?.querySelector<HTMLButtonElement>('button')?.focus();
      wasFull.current = false;
    }
  }, [size]);
  if (!context) return null;
  const { id, part } = resolve(context.sceneId);
  const [x, y, w, h] = part.focus;
  const hide = () => {
    setSize('hidden');
    requestAnimationFrame(() => toggle.current?.focus());
  };
  const pages = id === 'P122-C' ? '122–123' : part.page;
  const body = (
    <>
      <header className="book-reference-tools">
        <span>{t('book.reference.from', { pages })}</span>
        <div role="group" aria-label={t('book.reference.sizes')}>
          <button
            aria-label={t('book.reference.smallLabel')}
            aria-pressed={size === 'small'}
            onClick={() => setSize('small')}
          >
            {t('book.reference.small')}
          </button>
          <button
            aria-label={t('book.reference.halfLabel')}
            aria-pressed={size === 'half'}
            onClick={() => setSize('half')}
          >
            {t('book.reference.half')}
          </button>
          <button
            aria-label={t('book.reference.fullLabel')}
            aria-pressed={size === 'full'}
            onClick={() => setSize('full')}
          >
            {t('book.reference.full')}
          </button>
          <button aria-label={t('book.reference.hideLabel')} onClick={hide}>
            {t('book.reference.hide')}
          </button>
        </div>
      </header>
      <button
        className="book-reference-paper"
        aria-label={size === 'small' ? t('book.reference.zoomIn') : t('book.reference.zoomOut')}
        onClick={() => setSize(size === 'small' ? 'half' : 'small')}
      >
        <svg
          viewBox={`0 0 ${part.width} ${part.height}`}
          role="img"
          aria-label={t('book.reference.image', { pages })}
        >
          <image
            href={`${assetBase}/reference/${part.file}`}
            width={part.width}
            height={part.height}
          />
          <rect
            data-reference-focus
            x={x * part.width}
            y={y * part.height}
            width={w * part.width}
            height={h * part.height}
          />
        </svg>
      </button>
    </>
  );
  return createPortal(
    size === 'hidden' ? (
      <button
        ref={toggle}
        className="book-reference-toggle"
        data-reference-section={id}
        aria-label={t('book.reference.open')}
        dir={dir}
        onClick={() => setSize('small')}
      >
        {t('book.reference.toggle', { pages })}
      </button>
    ) : size === 'full' ? (
      <dialog
        ref={dialog}
        className="book-reference"
        data-size="full"
        data-reference-section={id}
        aria-label={t('book.reference.fullDialog')}
        dir={dir}
        onCancel={(event) => {
          event.preventDefault();
          setSize('small');
        }}
      >
        {body}
      </dialog>
    ) : (
      <aside
        ref={panel}
        className="book-reference"
        data-size={size}
        data-reference-section={id}
        aria-label={t('book.reference.panel')}
        dir={dir}
      >
        {body}
      </aside>
    ),
    document.body,
  );
}
