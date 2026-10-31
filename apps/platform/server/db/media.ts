import { boolean, index, jsonb, real, text, timestamp } from 'drizzle-orm/pg-core';
import { appSchema } from './content';

// Recorded narration (docs/voice-agent.md): one row per recorded line, keyed by the hash of
// what was said and how (the text, the tone, the course's voice, the language). The audio
// itself sits in R2 under the same hash (`audio/<hash>.wav`), so an unchanged line is never
// recorded twice and every learner plays the same file.

/** One word of a clip and when it is said, in seconds from the clip's start. */
export type AudioWord = { w: string; t0: number; t1: number };

export const lessonAudio = appSchema.table(
  'lesson_audio',
  {
    hash: text('hash').primaryKey(),
    /** Who paid for the recording. */
    ownerId: text('owner_id').notNull(),
    seconds: real('seconds').notNull(),
    words: jsonb('words').$type<AudioWord[]>().notNull().default([]),
    /** What the listen-back heard, and how much of the script it matched (0..1). */
    heard: text('heard').notNull().default(''),
    score: real('score'),
    /** Below the quality bar after a retry: the teacher should listen to it. */
    flagged: boolean('flagged').notNull().default(false),
    model: text('model').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('lesson_audio_owner').on(t.ownerId)],
);
