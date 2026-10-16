import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LessonContext } from '@learn/lesson-runtime';
import { referencePart } from '../../../../../content/book-guided/physics-ch08/reference';
import './book-reference.css';

type Size = 'hidden' | 'small' | 'half' | 'full';
/** An optional scan reference beside the normal board, always following its lesson position. */
export function BookReference({ context }: { context: LessonContext | null }) {
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
  const { id, part } = referencePart(context.sceneId);
  const [x, y, w, h] = part.focus;
  const hide = () => {
    setSize('hidden');
    requestAnimationFrame(() => toggle.current?.focus());
  };
  const pages = id === 'P122-C' ? '122–123' : part.page;
  const body = (
    <>
      <header className="book-reference-tools">
        <span>من الكتاب · ص {pages}</span>
        <div role="group" aria-label="حجم مرجع الكتاب">
          <button
            aria-label="مرجع صغير"
            aria-pressed={size === 'small'}
            onClick={() => setSize('small')}
          >
            صغير
          </button>
          <button
            aria-label="مرجع بنصف الشاشة"
            aria-pressed={size === 'half'}
            onClick={() => setSize('half')}
          >
            نص الشاشة
          </button>
          <button
            aria-label="مرجع بملء الشاشة"
            aria-pressed={size === 'full'}
            onClick={() => setSize('full')}
          >
            كامل
          </button>
          <button aria-label="إخفاء مرجع الكتاب" onClick={hide}>
            إخفاء
          </button>
        </div>
      </header>
      <button
        className="book-reference-paper"
        aria-label={
          size === 'small' ? 'تكبير الجزء المشروح من الكتاب' : 'تصغير الجزء المشروح من الكتاب'
        }
        onClick={() => setSize(size === 'small' ? 'half' : 'small')}
      >
        <svg
          viewBox={`0 0 ${part.width} ${part.height}`}
          role="img"
          aria-label={`الجزء المشروح من صفحة ${pages}`}
        >
          <image
            href={`/book-ch08/reference/${part.file}`}
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
        aria-label="افتح مرجع الكتاب"
        onClick={() => setSize('small')}
      >
        الكتاب · ص {pages}
      </button>
    ) : size === 'full' ? (
      <dialog
        ref={dialog}
        className="book-reference"
        data-size="full"
        data-reference-section={id}
        aria-label="مرجع الكتاب بملء الشاشة"
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
        aria-label="مرجع الكتاب"
      >
        {body}
      </aside>
    ),
    document.body,
  );
}
