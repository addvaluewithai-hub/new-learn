import { useState } from 'react';
import type { BoardValues, VisualProps } from '@learn/lesson-runtime';
import { HtmlBoard } from '../boards/HtmlBoard';
import { builtSource } from '../boards/sources';
import type { Look } from './looks';
import { Button, ButtonLink, Dialog } from '../../shared/ui';
import { useI18n } from '../../i18n';

/** A look's demo board, live and open to play with, before the teacher picks it. */
export function LookPreview({
  look,
  onClose,
  onChoose,
}: {
  look: Look;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const { t } = useI18n();
  const manifest = builtSource(look.board ?? '')?.manifest;
  const defaults = Object.fromEntries(
    Object.entries(manifest?.variables ?? {}).map(([k, v]) => [k, v.default]),
  ) as BoardValues;
  const [values, setValues] = useState<BoardValues>(defaults);
  const portrait = typeof matchMedia !== 'undefined' && matchMedia('(max-width: 640px)').matches;
  const view = {
    variables: values,
    highlight: [],
    reveal: [],
    notes: [],
    input: 'open' as const,
    phase: 'teach' as const,
    step: 0,
  };
  const props = {
    spec: { renderer: 'html-board', params: { board: look.board } },
    layout: portrait ? 'portrait' : 'landscape',
    reducedMotion: false,
    board: {
      view,
      onValues: (v: BoardValues) => setValues((now) => ({ ...now, ...v })),
      onObservation: () => {},
    },
  } as unknown as VisualProps;
  return (
    <Dialog
      size="lg"
      className="look-preview"
      title={t(look.name)}
      description={t('studio.preview.description', { line: t(look.line) })}
      onClose={onClose}
      footer={
        <>
          <Button
            onClick={() => {
              onChoose(look.id);
              onClose();
            }}
          >
            {t('studio.preview.choose')}
          </Button>
          {look.demo && (
            <ButtonLink
              variant="secondary"
              href={`/?preview=demo&id=${look.demo}`}
              target="_blank"
              rel="noreferrer"
            >
              {t('studio.preview.openDemo')}
            </ButtonLink>
          )}
        </>
      }
    >
      <div className={`look-preview-board ${portrait ? 'portrait' : ''}`}>
        <HtmlBoard {...props} />
      </div>
    </Dialog>
  );
}
