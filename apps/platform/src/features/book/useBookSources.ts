import { useEffect, useRef, useState } from 'react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import worker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { sourceHashes, type BookSources } from './source';

GlobalWorkerOptions.workerSrc = worker;

export function useBookSources() {
  const [sources, setSources] = useState<BookSources>({});
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const owned = useRef<BookSources>({});
  const generation = useRef(0);
  useEffect(
    () => () => {
      generation.current++;
      for (const pdf of Object.values(owned.current)) void pdf?.destroy();
    },
    [],
  );

  const open = async (files: FileList | null) => {
    if (!files?.length) return;
    const turn = ++generation.current;
    setBusy(true);
    setStatus('بنتأكد من نسخة الكتاب…');
    try {
      for (const file of Array.from(files)) {
        if (file.size > 50 * 1024 * 1024)
          throw new Error('اختار ملف الكتاب الأصلي، أقل من 50 ميجابايت.');
        const bytes = await file.arrayBuffer();
        const digest = await crypto.subtle.digest('SHA-256', bytes);
        const hash = Array.from(new Uint8Array(digest), (b) =>
          b.toString(16).padStart(2, '0'),
        ).join('');
        const kind = sourceHashes[hash];
        if (!kind)
          throw new Error(
            'ده ملف مختلف عن نسخة الكتاب المستخدمة في الشرح. اختار ملف الـ19 صفحة أو ملف الصفحتين 124 و125.',
          );
        const pdf = await getDocument({ data: new Uint8Array(bytes), isEvalSupported: false })
          .promise;
        if (generation.current !== turn) {
          await pdf.destroy();
          return;
        }
        const previous = owned.current[kind];
        owned.current = { ...owned.current, [kind]: pdf };
        setSources({ ...owned.current });
        void previous?.destroy();
      }
      if (generation.current === turn)
        setStatus(
          owned.current.main
            ? 'الكتاب مفتوح من جهازك.'
            : 'صورة الصفحتين 124 و125 جاهزة. افتح الملف الكبير لباقي الفصل.',
        );
    } catch (error) {
      if (generation.current === turn)
        setStatus(error instanceof Error ? error.message : 'تعذّر فتح الملف. جرّب تاني.');
    } finally {
      if (generation.current === turn) setBusy(false);
    }
  };
  return { sources, status, busy, open };
}
