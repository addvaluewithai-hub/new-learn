import { useEffect, useRef, useState } from 'react';
import { sourcePosition, type BookSources } from './source';

export function BookPage({
  page,
  id,
  sources,
}: {
  page: number;
  id: string;
  sources: BookSources;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [marked, setMarked] = useState(true);
  const [status, setStatus] = useState('');
  const source = sourcePosition(page, id, sources);
  const doc = source.document;
  const [x, y, w, h] = source.focus;
  useEffect(() => {
    let active = true;
    let task: { cancel: () => void } | undefined;
    if (!doc) return;
    setStatus('بنفتح الصفحة…');
    void doc
      .getPage(source.pdfPage)
      .then(async (pdfPage) => {
        if (!active) return;
        const viewport = pdfPage.getViewport({ scale: 1.5, rotation: source.rotation });
        const offscreen = document.createElement('canvas');
        offscreen.width = Math.ceil(viewport.width);
        offscreen.height = Math.ceil(viewport.height);
        const render = pdfPage.render({ canvas: offscreen, viewport });
        task = render;
        await render.promise;
        if (!active || !canvas.current) return;
        const [cx, cy, cw, ch] = source.crop;
        canvas.current.width = Math.round(offscreen.width * cw);
        canvas.current.height = Math.round(offscreen.height * ch);
        const ctx = canvas.current.getContext('2d');
        if (!ctx) throw new Error('Canvas unavailable');
        ctx.drawImage(
          offscreen,
          cx * offscreen.width,
          cy * offscreen.height,
          cw * offscreen.width,
          ch * offscreen.height,
          0,
          0,
          canvas.current.width,
          canvas.current.height,
        );
        canvas.current.dataset.page = String(page);
        canvas.current.dataset.document = doc.fingerprints[0];
        setStatus('');
      })
      .catch((error: Error) => {
        if (active && error.name !== 'RenderingCancelledException')
          setStatus('تعذّر عرض الصفحة. جرّب فتح الملف تاني.');
      });
    return () => {
      active = false;
      task?.cancel();
    };
  }, [doc, source.pdfPage, source.rotation, page]);

  return (
    <section className="bk-source" aria-label={`صفحة الكتاب ${page}`}>
      <div className="bk-source-tools">
        <span>
          صفحة <b>{page}</b> من الكتاب
        </span>
        <div>
          <button onClick={() => setMarked(!marked)} aria-pressed={marked}>
            تحديد الجزء
          </button>
          <button
            onClick={() => setZoom(zoom === 1 ? 1.5 : zoom === 1.5 ? 2 : 1)}
            aria-label="تكبير الصفحة"
          >
            {zoom * 100}%
          </button>
        </div>
      </div>
      {!doc ? (
        <div className="bk-source-empty">
          <span className="bk-book-mark" aria-hidden>
            ٨
          </span>
          <h2>افتح كتابك جنب الشرح</h2>
          <p>
            اختار ملف الـPDF اللي بعته. الصفحة هتتغيّر تلقائيًا مع الشرح، والملف يفضل على جهازك.
          </p>
          <label className="bk-primary" htmlFor="book-file">
            افتح ملف الكتاب
          </label>
          <p className="bk-small">تقدر تبدأ القراءة دلوقتي، وتفتح الكتاب في أي وقت.</p>
        </div>
      ) : (
        <div className="bk-page-scroll">
          <div className="bk-page-image" style={{ width: `${zoom * 100}%` }}>
            <canvas ref={canvas} aria-label={`صورة الصفحة المطبوعة ${page}`} />
            {marked && !status ? (
              <div
                className="bk-source-focus"
                aria-hidden
                style={{
                  left: `${x * 100}%`,
                  top: `${y * 100}%`,
                  width: `${w * 100}%`,
                  height: `${h * 100}%`,
                }}
              />
            ) : null}
          </div>
          <p role="status" className="bk-render-status">
            {status}
          </p>
        </div>
      )}
    </section>
  );
}
