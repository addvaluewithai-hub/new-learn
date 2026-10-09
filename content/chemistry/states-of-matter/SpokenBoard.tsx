import { AbsoluteFill } from 'remotion';
import { spokenChunkAt } from './spokenBoard';
import type { ReactNode } from 'react';
import type { LessonLayout, LessonRecording } from '@learn/lesson-runtime/core';

export function SpokenBoardFrame({
  recording,
  frame,
  layout,
  fromMs = 0,
  feedback = false,
  reducedMotion = false,
  context,
  fps = 30,
  teaching = false,
}: {
  recording: LessonRecording;
  frame: number;
  layout: LessonLayout;
  fromMs?: number;
  feedback?: boolean;
  reducedMotion?: boolean;
  context?: ReactNode;
  fps?: number;
  teaching?: boolean;
}) {
  const chunk = spokenChunkAt(recording, frame, fromMs, fps);
  const portrait = layout === 'portrait';
  const showModel = !feedback && Boolean(context);
  return (
    <AbsoluteFill
      data-states-composition={layout}
      data-board-phase={feedback ? 'feedback' : teaching ? 'teaching' : 'question-reading'}
      data-spoken-board={feedback ? 'feedback' : teaching ? 'teaching' : 'question'}
      data-spoken-at={chunk?.atMs}
      style={{
        background: '#fffefb',
        color: '#243e3b',
        fontFamily: '"Segoe UI",Tahoma,Arial,sans-serif',
        overflow: 'hidden',
      }}
    >
      <h1
        data-safe-element="heading"
        dir="rtl"
        style={{
          position: 'absolute',
          top: portrait ? 54 : 30,
          left: 36,
          right: 36,
          margin: 0,
          fontSize: 40,
          lineHeight: 1.45,
          textAlign: 'center',
        }}
      >
        {feedback ? 'نراجع الفكرة، وبعدها نكمل' : teaching ? 'خلّينا نفهم الفكرة' : 'خلّينا نجرب'}
      </h1>
      {chunk ? (
        <div
          data-safe-element="spoken-text"
          data-board-part={feedback ? 'feedback' : teaching ? 'teaching' : 'question'}
          dir={chunk.language === 'ar' ? 'rtl' : 'ltr'}
          lang={chunk.language}
          style={{
            position: 'absolute',
            left: portrait ? 38 : 64,
            right: portrait ? 38 : 64,
            top: portrait ? 220 : 155,
            bottom: showModel ? (portrait ? 340 : 220) : portrait ? 160 : 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: portrait ? 42 : 40,
            lineHeight: 1.55,
            fontWeight: 550,
            textAlign: 'center',
          }}
        >
          {chunk.text}
        </div>
      ) : null}
      {showModel ? (
        <div
          data-safe-element="question-model"
          style={{
            position: 'absolute',
            bottom: portrait ? 100 : 30,
            left: '50%',
            marginLeft: -100,
            width: 200,
            height: 156,
          }}
        >
          {context}
        </div>
      ) : null}
    </AbsoluteFill>
  );
}
