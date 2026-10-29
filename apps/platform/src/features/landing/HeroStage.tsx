import { useEffect, useRef, useState } from 'react';
import type { VisualProps } from '@learn/lesson-runtime';
import { HtmlBoard } from '../boards/HtmlBoard';
import { DEMOS } from '../../../../../fixtures/demos';
import {
  HERO_LOOKS,
  LOOK_PAUSE_MS,
  STEP_MS,
  loadHeroSteps,
  type HeroLook,
  type HeroStep,
} from './hero';
import './hero.css';

/**
 * The hero's stage: one look's demo board, live, replaying the first scene of its lesson line
 * by line. It moves to the next look by itself until the visitor picks one; the poster shows
 * until the board is ready (or when the board origin is unreachable).
 */
export function HeroStage({
  look,
  pinned,
  onChange,
}: {
  look: HeroLook;
  pinned: boolean;
  onChange: (look: HeroLook, pinned: boolean) => void;
}) {
  const [steps, setSteps] = useState<HeroStep[]>([]);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const stage = useRef<HTMLDivElement>(null);
  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    let live = true;
    setSteps([]);
    setIndex(0);
    loadHeroSteps(look).then((loaded) => live && setSteps(loaded));
    return () => {
      live = false;
    };
  }, [look]);

  // Only a stage on screen, in a visible tab, keeps the lesson moving.
  useEffect(() => {
    const node = stage.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !steps.length) return;
    const last = index >= steps.length - 1;
    const wait = last ? STEP_MS + LOOK_PAUSE_MS : STEP_MS;
    const timer = setTimeout(() => {
      if (document.hidden) return;
      if (!last) return setIndex(index + 1);
      if (pinned) return setIndex(0);
      const at = HERO_LOOKS.indexOf(look);
      onChange(HERO_LOOKS[(at + 1) % HERO_LOOKS.length], false);
    }, wait);
    return () => clearTimeout(timer);
  }, [visible, steps, index, pinned, look, onChange]);

  const step = steps[index];
  const demo = DEMOS.find((d) => d.id === look.demo);
  const props = {
    spec: { renderer: 'html-board', params: { board: look.board } },
    layout: 'landscape',
    reducedMotion: reduced,
    board: step ? { view: step.view, onValues: () => {}, onObservation: () => {} } : undefined,
  } as unknown as VisualProps;
  return (
    <div className="hero-stage" ref={stage}>
      <div className="hero-screen" style={{ background: look.colors[0] }}>
        <img className="hero-poster" src={`/styles/${look.id}.webp`} alt="" />
        <HtmlBoard key={look.id} {...props} />
      </div>
      <div className="hero-caption">
        <p className="hero-line" key={`${look.id}-${index}`}>
          {step?.text ?? demo?.title ?? ''}
        </p>
        <div className="hero-meta">
          <a href={`/?preview=demo&id=${look.demo}`}>
            {demo?.title} <span aria-hidden="true">←</span>
          </a>
          <span className="hero-dots" aria-hidden="true">
            {steps.map((_, i) => (
              <i key={i} className={i === index ? 'on' : i < index ? 'done' : ''} />
            ))}
          </span>
        </div>
      </div>
      <div className="hero-chips" role="group" aria-label="الأشكال">
        {HERO_LOOKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="hero-chip"
            aria-pressed={item.id === look.id}
            style={
              item.id === look.id
                ? { background: item.colors[0], color: item.colors[1], borderColor: item.colors[1] }
                : undefined
            }
            onClick={() => onChange(item, true)}
          >
            <i style={{ background: item.colors[1], outlineColor: item.colors[0] }} />
            {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
