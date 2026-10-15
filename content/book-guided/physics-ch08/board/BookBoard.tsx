import { AbsoluteFill } from 'remotion';
import type { VisualProps } from '@learn/lesson-runtime';
import { Formula } from './Formula';
import { topics } from './topics';
import { Materials } from './Materials';
import { LoadingDiagram } from './LoadingDiagram';
import { StressCurve } from './StressCurve';
import './book-board.css';

function Diagram({ id, page }: { id: string; page: number }) {
  if (page === 121) return <Materials mode="states" />;
  if (page === 122) return <Materials mode="bonds" />;
  if (page === 123) return <Materials mode={id === 'P122-B' ? 'bonds' : 'structure'} />;
  if (id === 'P125-B' || id === 'P126-C') return <StressCurve />;
  if (id === 'P125-C' || id === 'P133-Z')
    return (
      <div className="ch8-moduli">
        {(['axial', 'shear', 'bulk'] as const).map((kind, i) => (
          <div key={kind}>
            <LoadingDiagram kind={kind} />
            <span>{['Y', 'S', 'B'][i]}</span>
          </div>
        ))}
      </div>
    );
  const kind =
    page === 130
      ? 'compression'
      : page === 131
        ? 'bone'
        : page === 132
          ? 'pancakes'
          : page >= 129 || id === 'P128-C'
            ? 'bulk'
            : page === 128
              ? 'shear'
              : 'axial';
  return <LoadingDiagram kind={kind} />;
}

/** A normal lesson-owned board. The book stays in the learner's hands. */
export default function BookBoard(props: VisualProps) {
  const id = String(props.spec.params.sectionId);
  const page = Number(props.spec.params.page);
  const topic = topics[id] ?? topics['P133-Z'];
  const time = (props.frame * 1000) / props.fps;
  const index = Math.max(0, (props.reading?.steps.filter((s) => s.atMs <= time).length ?? 1) - 1);
  const raw = (props.spec.params.rawSteps as string[])[index] ?? '';
  const maths = [...raw.matchAll(/\$\$([\s\S]*?)\$\$|\$([^$]+)\$/g)]
    .flatMap((m) => (m[1] ?? m[2]).split(/\\qquad|\\quad/))
    .filter(Boolean)
    .slice(0, 4);
  const warning =
    id === 'P130-Q1'
      ? 'الحساب العددي مشروط بتأكيد الحمل؛ حد إجهاد الفشل غير معطى.'
      : id === 'P131-Q2'
        ? 'قيمة معامل يونج في الحل تقريبية ومضافة من مرجع خارجي.'
        : '';
  return (
    <AbsoluteFill>
      <div className="ch8-board" data-layout={props.layout} data-book-section={id} dir="rtl">
        <header>
          <span>شابتر 8 · ص {id === 'P122-C' ? '122–123' : page}</span>
          <span>{props.phase === 'feedback' ? 'الحل بعد محاولتك' : 'نمشي مع الكتاب'}</span>
        </header>
        <h2 lang="en" dir="ltr">
          {topic.title}
        </h2>
        <div className="ch8-diagram">
          <Diagram id={id} page={page} />
        </div>
        <section className="ch8-points" aria-label="بورد المعلّم">
          {maths.length
            ? maths.map((math, i) => <Formula key={i} source={math} />)
            : topic.words.map((word) => (
                <p key={word} lang="en" dir="ltr">
                  {word}
                </p>
              ))}
        </section>
        <footer>
          <p>{topic.note}</p>
          {warning ? <small>{warning}</small> : null}
        </footer>
      </div>
    </AbsoluteFill>
  );
}
