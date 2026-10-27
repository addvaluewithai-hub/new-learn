import React from 'react';
import type { VisualProps } from '@learn/lesson-runtime';

// A plain title board: these lessons are taught by their text (and by voice in audio
// mode). It shows the scene title, and the question or answer label on those pages.
export default function TextBoard(props: VisualProps) {
  const portrait = props.layout === 'portrait';
  const title = String(props.spec.params.title ?? '');
  const kicker =
    props.phase === 'feedback' ? 'الإجابة' : props.phase === 'question-reading' ? 'سؤال' : '';
  return (
    <div
      dir="rtl"
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        background: '#153d35',
        color: '#fff',
        fontFamily: "'IBM Plex Sans Arabic', Tahoma, Arial, sans-serif",
        textAlign: 'center',
        padding: portrait ? '12%' : '8%',
        boxSizing: 'border-box',
      }}
    >
      <div>
        {kicker && (
          <div style={{ color: '#d7f77b', fontSize: portrait ? 44 : 34, marginBottom: 18 }}>
            {kicker}
          </div>
        )}
        <div style={{ fontSize: portrait ? 72 : 64, fontWeight: 600, lineHeight: 1.4 }}>{title}</div>
      </div>
    </div>
  );
}
