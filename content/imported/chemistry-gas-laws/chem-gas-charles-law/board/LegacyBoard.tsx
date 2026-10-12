import { AbsoluteFill } from 'remotion';
import type { VisualProps } from '@learn/lesson-runtime';
import type { ChemistryBoardSpec } from './boardContent';
import type { GasLaw } from './physics';
import { Written, fontFaces, uiFont } from './Notation';
import MatterExplorer from './MatterExplorer';
import PhaseExplorer from './PhaseExplorer';
import GasExplorer from './GasExplorer';
import LawSelector from './LawSelector';
import KelvinExplorer from './KelvinExplorer';
import ProblemWorkspace from './ProblemWorkspace';
import ReviewBoard from './ReviewBoard';
import './matter.css';
import './gas.css';
import './problem.css';
import './layout.css';
import './reveal.css';
import './fit.css';

function Content({
  spec,
  reducedMotion,
  available,
  initialCelsius,
  initialLaw,
  showLawEquations,
  referenceVolume,
}: {
  spec: ChemistryBoardSpec;
  reducedMotion: boolean;
  available: number;
  initialCelsius: number;
  initialLaw: GasLaw;
  showLawEquations: boolean;
  referenceVolume: number;
}) {
  if (spec.kind === 'matter')
    return <MatterExplorer focus={spec.focus} reducedMotion={reducedMotion} />;
  if (spec.kind === 'phases')
    return <PhaseExplorer direct={spec.direct} reducedMotion={reducedMotion} />;
  if (spec.kind === 'gas')
    return (
      <GasExplorer
        law={spec.law}
        focus={spec.focus}
        reducedMotion={reducedMotion}
        onDiscuss={() => {}}
        canDiscuss={false}
        referenceVolume={referenceVolume}
      />
    );
  if (spec.kind === 'selector')
    return (
      <LawSelector available={available} initial={initialLaw} showEquation={showLawEquations} />
    );
  if (spec.kind === 'kelvin') return <KelvinExplorer initial={initialCelsius} />;
  if (spec.kind === 'problem')
    return <ProblemWorkspace problem={spec.problem} worked={Boolean(spec.worked)} />;
  if (spec.kind === 'review') return <ReviewBoard topic={spec.topic} />;
  return (
    <>
      <div className="chem-title">
        <h2>STP — الظروف القياسية</h2>
        <p>قيم الحالة وفق التعريف المستخدم في هذا الكورس.</p>
      </div>
      <div className="chem-stp-grid">
        <article>
          <span>Temperature — الحرارة</span>
          <strong dir="ltr">273.15 K</strong>
          <small dir="ltr">0°C</small>
        </article>
        <article>
          <span>Pressure — الضغط</span>
          <strong dir="ltr">1 atm</strong>
          <small dir="ltr">760 mmHg</small>
        </article>
      </div>
      <div className="chem-observation">
        دي شروط حالة، مش قانون جديد. استخدم التعريف المذكور في السؤال.
      </div>
    </>
  );
}

export default function LegacyBoard(props: VisualProps) {
  const spec = props.spec.params.boardSpec as ChemistryBoardSpec;
  const reached =
    props.reading?.steps.filter((s) => s.atMs <= (props.frame * 1000) / props.fps) ?? [];
  const question = props.phase === 'question-reading',
    feedback = props.phase === 'feedback';
  const shown = question ? reached : feedback ? reached.slice(-1) : [];
  return (
    <AbsoluteFill
      className="legacy-chem"
      data-layout={props.layout}
      data-kind={spec.kind}
      data-beat={String(props.spec.params.beatId)}
      data-step={reached.length}
      data-phase={props.phase}
      dir="rtl"
      style={{ fontFamily: uiFont }}
    >
      <style>{fontFaces(props.spec.params.assetBase)}</style>
      {question || feedback ? (
        <div className="chem-reading-panel">
          <h2>{question ? 'اقرأ المسألة ثم حاول' : 'الإجابة وتفسيرها'}</h2>
          {shown.map((part, i) => (
            <p key={i} dir={/[\u0600-\u06ff]/.test(part.text) ? 'rtl' : 'ltr'}>
              <Written text={part.text} />
            </p>
          ))}
        </div>
      ) : (
        <div className="chemistry-experience" key={String(props.spec.params.beatId)}>
          <Content
            spec={spec}
            reducedMotion={props.reducedMotion}
            available={Number(props.spec.params.availableLaws ?? 4)}
            initialCelsius={Number(props.spec.params.initialCelsius ?? 27)}
            initialLaw={(props.spec.params.initialLaw ?? 'boyle') as GasLaw}
            showLawEquations={props.spec.params.showLawEquations !== false}
            referenceVolume={Number(props.spec.params.referenceVolume ?? 2.4)}
          />
        </div>
      )}
    </AbsoluteFill>
  );
}
